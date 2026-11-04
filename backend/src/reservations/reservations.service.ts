import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CompleteReservationRequest,
  CreateReservationRequest,
  ExtendReservationRequest,
  MyReservationsResponse,
  ReservationDto,
  ReservationStatus,
} from '../common/contracts/api.contracts';
import {
  LOCKER_HOLDING_STATUSES,
  MockDbService,
  PERIOD_DURATION_MS,
  ReservationRecord,
  UserRecord,
} from '../common/mock/mock-db.service';

const ACTIVE_LIST_STATUSES: ReservationStatus[] = ['Active', 'Expired', 'Incident'];

@Injectable()
export class ReservationsService {
  constructor(private readonly db: MockDbService) {}

  /**
   * Contrata e ativa imediatamente o aluguel para o MVP (sem gateway externo).
   *
   * TODO [PLANO-BACKEND]: executar dentro de `prisma.$transaction` para evitar
   * dupla alocação simultânea do mesmo compartimento.
   */
  createReservation(user: UserRecord, dto: CreateReservationRequest): ReservationDto {
    if (!dto?.locationId || !dto?.size || !dto?.period) {
      throw new BadRequestException('Informe ponto, tamanho e período.');
    }
    const location = this.db.findLocationById(dto.locationId);
    if (!location || location.status !== 'ACTIVE') {
      throw new NotFoundException('Ponto indisponível para reservas.');
    }
    const plan = this.db.priceFor(location.id, dto.size, dto.period);
    if (!plan) {
      throw new BadRequestException('Não há preço configurado para este tamanho e período.');
    }

    const isFree = (lockerId: string) =>
      !this.db.reservations.some(
        (r) => r.lockerId === lockerId && LOCKER_HOLDING_STATUSES.includes(r.status),
      );

    const locker = dto.lockerId
      ? this.db.findLockerById(dto.lockerId)
      : this.db
          .lockersOf(location.id)
          .find((l) => l.size === dto.size && l.status === 'AVAILABLE' && isFree(l.id));

    if (!locker || locker.locationId !== location.id || locker.size !== dto.size) {
      throw new ConflictException('Nenhum compartimento compatível disponível no momento.');
    }
    if (locker.status !== 'AVAILABLE' || !isFree(locker.id)) {
      throw new ConflictException('Este compartimento já está ocupado. Escolha outro.');
    }

    const start = new Date();
    const reservation: ReservationRecord = {
      id: this.db.nextId('res'),
      userId: user.id,
      locationId: location.id,
      lockerId: locker.id,
      size: dto.size,
      period: dto.period,
      startTime: start.toISOString(),
      endTime: new Date(start.getTime() + PERIOD_DURATION_MS[dto.period]).toISOString(),
      status: 'Active',
      totalPriceCents: plan.priceCents,
      createdAt: start.toISOString(),
    };
    locker.status = 'OCCUPIED';
    this.db.reservations.push(reservation);
    return this.db.toReservationDto(reservation);
  }

  listUserReservations(user: UserRecord): MyReservationsResponse {
    this.syncExpiredReservations();
    const mine = this.db.reservations
      .filter((r) => r.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => this.db.toReservationDto(r));
    return {
      active: mine.filter((r) => ACTIVE_LIST_STATUSES.includes(r.status)),
      history: mine.filter((r) => !ACTIVE_LIST_STATUSES.includes(r.status)),
    };
  }

  getReservationById(user: UserRecord, id: string): ReservationDto {
    this.syncExpiredReservations();
    return this.db.toReservationDto(this.getAuthorizedReservation(user, id, true));
  }

  extendReservation(user: UserRecord, id: string, dto: ExtendReservationRequest): ReservationDto {
    const reservation = this.getAuthorizedReservation(user, id);
    if (reservation.status !== 'Active') {
      throw new BadRequestException('Apenas aluguéis ativos podem ser prorrogados.');
    }
    const additional = dto?.additionalPeriod;
    const plan = additional
      ? this.db.priceFor(reservation.locationId, reservation.size, additional)
      : undefined;
    if (!additional || !plan) {
      throw new BadRequestException('Período de prorrogação inválido.');
    }

    reservation.endTime = new Date(
      new Date(reservation.endTime).getTime() + PERIOD_DURATION_MS[additional],
    ).toISOString();
    reservation.totalPriceCents += plan.priceCents;
    return this.db.toReservationDto(reservation);
  }

  completeReservation(
    user: UserRecord,
    id: string,
    dto: CompleteReservationRequest,
  ): ReservationDto {
    const reservation = this.getAuthorizedReservation(user, id);
    if (!dto?.confirmedEmptyAndClosed) {
      throw new BadRequestException(
        'Confirme que retirou seus pertences e fechou a porta do compartimento.',
      );
    }
    if (reservation.status !== 'Active') {
      throw new BadRequestException('Apenas aluguéis ativos podem ser finalizados pelo aplicativo.');
    }
    reservation.status = 'Completed';
    reservation.endTime = new Date().toISOString();
    const locker = this.db.findLockerById(reservation.lockerId);
    if (locker) locker.status = 'AVAILABLE';
    return this.db.toReservationDto(reservation);
  }

  cancelPendingReservation(user: UserRecord, id: string): ReservationDto {
    const reservation = this.getAuthorizedReservation(user, id);
    if (reservation.status !== 'Active') {
      throw new BadRequestException('Esta reserva não pode mais ser cancelada.');
    }
    reservation.status = 'Cancelled';
    const locker = this.db.findLockerById(reservation.lockerId);
    if (locker && locker.status === 'OCCUPIED') locker.status = 'AVAILABLE';
    return this.db.toReservationDto(reservation);
  }

  getAuthorizedReservation(
    user: UserRecord,
    id: string,
    allowPartnerRead = false,
  ): ReservationRecord {
    const reservation = this.db.findReservationById(id);
    if (!reservation) throw new NotFoundException('Reserva não encontrada.');
    if (reservation.userId === user.id || user.roles.includes('ADMIN')) return reservation;
    if (allowPartnerRead) {
      const partner = this.db.findPartnerByUserId(user.id);
      const location = this.db.findLocationById(reservation.locationId);
      if (partner && location?.partnerId === partner.id) return reservation;
    }
    throw new ForbiddenException('Você não tem acesso a esta reserva.');
  }

  /**
   * Regra crítica: aluguel ativo vencido vira `Expired` SEM liberar o locker automaticamente.
   */
  syncExpiredReservations() {
    const now = Date.now();
    this.db.reservations
      .filter((r) => r.status === 'Active' && new Date(r.endTime).getTime() < now)
      .forEach((r) => (r.status = 'Expired'));
  }
}
