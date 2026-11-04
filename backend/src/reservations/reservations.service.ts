import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CompleteReservationRequest, CreateReservationRequest, ExtendReservationRequest, MyReservationsResponse, UserDto } from '../common/contracts/api.contracts';
import { Store } from '../common/store.service';
import { reservationDto, reservationInclude } from '../common/mappers';
import { addPrice, assertOngoing, LOCKER_HOLDING_STATUSES, PERIOD_DURATION_MS } from '../common/domain';
@Injectable()
export class ReservationsService {
  constructor(private readonly store: Store) {}
  async createReservation(user: UserDto, dto: CreateReservationRequest) {
    await this.store.refreshExpired();
    return this.store.db.atomic(async tx => {
      const location = await tx.location.findUnique({ where: { id: dto.locationId }, include: { partner: true } });
      if (!location || location.status !== 'ACTIVE' || location.partner.status !== 'APPROVED') throw new NotFoundException('Ponto indisponível para reservas.');
      const plan = await tx.pricingPlan.findUnique({ where: { locationId_size_period: { locationId: location.id, size: dto.size, period: dto.period } } });
      if (!plan) throw new BadRequestException('Não há preço configurado para este tamanho e período.');
      const locker = await tx.locker.findFirst({ where: {
        ...(dto.lockerId ? { id: dto.lockerId } : {}), locationId: location.id, size: dto.size, status: 'AVAILABLE',
        reservations: { none: { status: { in: LOCKER_HOLDING_STATUSES } } },
      }, orderBy: { code: 'asc' } });
      if (!locker) throw new ConflictException('Nenhum compartimento compatível disponível no momento.');
      // Compare-and-set dentro da transação impede dois pedidos de ocuparem o mesmo locker.
      const claimed = await tx.locker.updateMany({ where: { id: locker.id, status: 'AVAILABLE' }, data: { status: 'OCCUPIED' } });
      if (claimed.count !== 1) throw new ConflictException('Este compartimento já está ocupado.');
      const startTime = this.store.clock.now();
      const r = await tx.reservation.create({ data: { userId: user.id, locationId: location.id, lockerId: locker.id,
        size: dto.size, period: dto.period, startTime, endTime: new Date(startTime.getTime() + PERIOD_DURATION_MS[dto.period]),
        status: 'Active', totalPriceCents: plan.priceCents }, include: reservationInclude });
      return reservationDto(r);
    });
  }
  async listUserReservations(user: UserDto): Promise<MyReservationsResponse> {
    await this.store.refreshExpired();
    const rows = await this.store.db.reservation.findMany({ where: { userId: user.id }, include: reservationInclude, orderBy: { createdAt: 'desc' } });
    return { active: rows.filter(r => LOCKER_HOLDING_STATUSES.includes(r.status as 'Active')).map(reservationDto),
      history: rows.filter(r => !LOCKER_HOLDING_STATUSES.includes(r.status as 'Active')).map(reservationDto) };
  }
  async getReservationById(user: UserDto, id: string) {
    await this.store.refreshExpired();
    return reservationDto(await this.store.reservation(this.store.db, user, id, true));
  }
  async extendReservation(user: UserDto, id: string, dto: ExtendReservationRequest) {
    await this.store.refreshExpired();
    return this.store.db.atomic(async tx => {
      const r = await this.store.reservation(tx, user, id);
      const plan = await tx.pricingPlan.findUnique({ where: { locationId_size_period: { locationId: r.locationId, size: r.size, period: dto.additionalPeriod } } });
      if (!plan) throw new BadRequestException('Período de prorrogação não configurado.');
      assertOngoing(r, this.store.clock.now());
      const updated = await tx.reservation.update({ where: { id }, data: { endTime: new Date(r.endTime.getTime() + PERIOD_DURATION_MS[dto.additionalPeriod]),
        totalPriceCents: addPrice(r.totalPriceCents, plan.priceCents) }, include: reservationInclude });
      return reservationDto(updated);
    });
  }
  async completeReservation(user: UserDto, id: string, dto: CompleteReservationRequest) {
    if (dto.confirmedEmptyAndClosed !== true) throw new BadRequestException('Confirme que retirou seus pertences e fechou o compartimento.');
    await this.store.refreshExpired();
    return this.store.db.atomic(async tx => {
      const r = await this.store.reservation(tx, user, id);
      if (r.status === 'Completed') return reservationDto(r);
      const now = this.store.clock.now();
      assertOngoing(r, now);
      const completed = await tx.reservation.update({ where: { id }, data: { status: 'Completed', endTime: now }, include: reservationInclude });
      await tx.locker.update({ where: { id: r.lockerId }, data: { status: 'AVAILABLE' } });
      return reservationDto(completed);
    });
  }
  async cancelPendingReservation(user: UserDto, id: string) {
    await this.store.refreshExpired();
    return this.store.db.atomic(async tx => {
      const r = await this.store.reservation(tx, user, id);
      if (r.status === 'Cancelled') return reservationDto(r);
      if (await tx.accessEvent.count({ where: { reservationId: id, result: 'CONFIRMED' } })) {
        throw new ConflictException('Após a primeira abertura, finalize confirmando retirada e fechamento ou solicite suporte.');
      }
      assertOngoing(r, this.store.clock.now());
      const cancelled = await tx.reservation.update({ where: { id }, data: { status: 'Cancelled' }, include: reservationInclude });
      await tx.locker.update({ where: { id: r.lockerId }, data: { status: 'AVAILABLE' } });
      return reservationDto(cancelled);
    });
  }
}
