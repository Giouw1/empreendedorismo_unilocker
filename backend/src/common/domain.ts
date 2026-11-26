import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { MIN_PRICE_CENTS, RentalPeriod, ReservationStatus, TicketCategory, UserRole } from './contracts/api.contracts';
export { MIN_PRICE_CENTS };

export const PERIOD_DURATION_MS: Record<RentalPeriod, number> = {
  DAILY: 86_400_000, WEEKLY: 7 * 86_400_000, MONTHLY: 30 * 86_400_000,
};
/** Status que retêm o compartimento (inclui a pré-reserva aguardando confirmação presencial). */
export const LOCKER_HOLDING_STATUSES: ReservationStatus[] = ['PendingConfirmation', 'Active', 'Expired', 'Incident'];
/** Status que não geram receita: cancelados e pré-reservas ainda não confirmadas. */
export const NON_REVENUE_STATUSES: ReservationStatus[] = ['Cancelled', 'PendingConfirmation'];
export const ROLES: UserRole[] = ['USER', 'PARTNER', 'ADMIN'];
export const SIZES = ['SMALL', 'MEDIUM', 'LARGE'] as const;
export const PERIODS = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;
export const RESERVATION_STATUSES = ['PendingConfirmation', 'Active', 'Completed', 'Cancelled', 'Expired', 'Incident'] as const;
export const LOCATION_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'INACTIVE', 'REJECTED'] as const;
export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;
export const CATEGORIES = ['LOCKER_WONT_OPEN', 'LOCKER_DAMAGED', 'ITEMS_TRAPPED', 'EXPIRED_RENTAL', 'OTHER'] as const;
/**
 * Preço mínimo por período (centavos). Diário R$ 5, semanal R$ 25 (R$ 3,57/dia) e mensal R$ 100 (R$ 3,33/dia):
 * quanto mais longo o aluguel, menor o custo por dia, mantendo margem para ofertador e plataforma.
 */
const PERIOD_LABEL: Record<RentalPeriod, string> = { DAILY: 'diário', WEEKLY: 'semanal', MONTHLY: 'mensal' };
export function assertMinimumPrices(plans: { period: RentalPeriod; priceCents: number }[]) {
  for (const p of plans) {
    const min = MIN_PRICE_CENTS[p.period];
    if (p.priceCents < min) {
      throw new BadRequestException(`O preço ${PERIOD_LABEL[p.period]} mínimo é R$ ${(min / 100).toFixed(2).replace('.', ',')}.`);
    }
  }
}
export function assertPendingConfirmation(status: string) {
  if (status !== 'PendingConfirmation') throw new ConflictException('Esta reserva não está aguardando confirmação presencial.');
}
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
