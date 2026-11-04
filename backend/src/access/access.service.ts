import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AccessEventDto, AccessResult } from '../common/contracts/api.contracts';
import { MockDbService, UserRecord } from '../common/mock/mock-db.service';

@Injectable()
export class AccessService {
  constructor(private readonly db: MockDbService) {}

  /**
   * Simula a abertura do compartimento pelo aplicativo no MVP.
   *
   * TODO [PLANO-BACKEND]: persistir `AccessEvent` via Prisma e validar janela
   * de horário de funcionamento do ponto.
   */
  requestUnlock(user: UserRecord, reservationId: string): AccessEventDto {
    const reservation = this.db.findReservationById(reservationId);
    if (!reservation) throw new NotFoundException('Reserva não encontrada.');

    const isOwnerOrAdmin = reservation.userId === user.id || user.roles.includes('ADMIN');
    if (!isOwnerOrAdmin) {
      throw new ForbiddenException('Você não tem permissão para abrir este compartimento.');
    }

    const locker = this.db.findLockerById(reservation.lockerId);
    if (!locker) throw new NotFoundException('Compartimento não encontrado.');

    let result: AccessResult = 'CONFIRMED';
    let message = `Compartimento ${locker.code} destravado! Guarde ou retire seus pertences.`;

    if (reservation.status !== 'Active') {
      result = 'UNAUTHORIZED';
      message = `Sua reserva está com status "${reservation.status}" e não permite abertura.`;
    } else if (locker.status === 'MAINTENANCE') {
      result = 'LOCKER_MAINTENANCE';
      message = 'Compartimento em manutenção. Acione o suporte.';
    }

    const event = {
      id: this.db.nextId('ae'),
      reservationId: reservation.id,
      lockerId: locker.id,
      userId: user.id,
      action: user.roles.includes('ADMIN') && reservation.userId !== user.id
        ? ('EMERGENCY_UNLOCK' as const)
        : ('UNLOCK_REQUEST' as const),
      result,
      message,
      createdAt: this.db.now(),
    };

    this.db.accessEvents.push(event);
    return this.db.toAccessEventDto(event);
  }

  listAccessEvents(user: UserRecord, reservationId: string): AccessEventDto[] {
    const reservation = this.db.findReservationById(reservationId);
    if (!reservation) throw new NotFoundException('Reserva não encontrada.');
    if (reservation.userId !== user.id && !user.roles.includes('ADMIN')) {
      throw new ForbiddenException('Você não tem acesso ao histórico desta reserva.');
    }
    return this.db.accessEvents
      .filter((e) => e.reservationId === reservationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((e) => this.db.toAccessEventDto(e));
  }
}
