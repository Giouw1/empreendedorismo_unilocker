import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { RentalPeriod, ReservationStatus, TicketCategory, UserRole } from './contracts/api.contracts';

export const PERIOD_DURATION_MS: Record<RentalPeriod, number> = {
  DAILY: 86_400_000, WEEKLY: 7 * 86_400_000, MONTHLY: 30 * 86_400_000,
};
export const LOCKER_HOLDING_STATUSES: ReservationStatus[] = ['Active', 'Expired', 'Incident'];
export const ROLES: UserRole[] = ['USER', 'PARTNER', 'ADMIN'];
export const SIZES = ['SMALL', 'MEDIUM', 'LARGE'] as const;
export const PERIODS = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;
export const RESERVATION_STATUSES = ['Active', 'Completed', 'Cancelled', 'Expired', 'Incident'] as const;
export const LOCATION_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'INACTIVE', 'REJECTED'] as const;
export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;
export const CATEGORIES = ['LOCKER_WONT_OPEN', 'LOCKER_DAMAGED', 'ITEMS_TRAPPED', 'EXPIRED_RENTAL', 'OTHER'] as const;
export function splitRevenue(grossCents: number) {
  const platformFeeCents = Math.round(grossCents / 10);
  return { grossAmountCents: grossCents, platformFeeCents, partnerNetCents: grossCents - platformFeeCents };
}
export function ticketPriority(category: TicketCategory): 'HIGH' | 'MEDIUM' {
  return ['LOCKER_WONT_OPEN', 'ITEMS_TRAPPED', 'EXPIRED_RENTAL'].includes(category) ? 'HIGH' : 'MEDIUM';
}
export function assertActive(status: string) {
  if (status !== 'Active') throw new ConflictException('Somente aluguéis ativos podem executar esta ação.');
}
export function assertOngoing(reservation: { status: string; startTime: Date; endTime: Date }, now: Date) {
  assertActive(reservation.status);
  if (reservation.startTime > now || reservation.endTime <= now) {
    throw new ConflictException('Aluguel fora da vigência. Solicite suporte para regularização.');
  }
}
export function assertLockerEditable(status: string, hasHoldingReservation: boolean) {
  if (status === 'OCCUPIED' || hasHoldingReservation) throw new ConflictException('Não é possível alterar um compartimento ocupado.');
}
export function addPrice(current: number, additional: number) {
  const total = current + additional;
  if (!Number.isSafeInteger(total) || total > 2_147_483_647) throw new BadRequestException('Valor total excede o limite permitido.');
  return total;
}
@Injectable()
export class Clock { now(): Date { return new Date(); } }
