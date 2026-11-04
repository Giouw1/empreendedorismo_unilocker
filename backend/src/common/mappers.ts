import { AccessEvent, Location, Locker, Partner, PricingPlan, Prisma, SupportTicket, User } from '@prisma/client';
import * as C from './contracts/api.contracts';
import { splitRevenue } from './domain';

export const locationInclude = { partner: true, lockers: true, pricingPlans: true } satisfies Prisma.LocationInclude;
export const reservationInclude = { user: true, location: true, locker: true } satisfies Prisma.ReservationInclude;
export const ticketInclude = { user: true, reservation: { include: { locker: true } } } satisfies Prisma.SupportTicketInclude;
export type LocationRow = Prisma.LocationGetPayload<{ include: typeof locationInclude }>;
export type ReservationRow = Prisma.ReservationGetPayload<{ include: typeof reservationInclude }>;
export type TicketRow = Prisma.SupportTicketGetPayload<{ include: typeof ticketInclude }>;
export const rolesOf = (user: Pick<User, 'rolesJson'>): C.UserRole[] => JSON.parse(user.rolesJson) as C.UserRole[];
export function userDto(user: User & { partner?: Partner | null }): C.UserDto {
  return { id: user.id, name: user.name, email: user.email, universityAffiliation: user.universityAffiliation,
    roles: rolesOf(user), partnerId: user.partner?.id ?? null, partnerStatus: (user.partner?.status as C.PartnerStatus) ?? null, createdAt: user.createdAt.toISOString() };
}
export function partnerDto(p: Partner): C.PartnerDto {
  return { id: p.id, userId: p.userId, organizationName: p.organizationName, organizationType: p.organizationType,
    responsibleName: p.responsibleName, contactPhone: p.contactPhone, status: p.status as C.PartnerStatus, createdAt: p.createdAt.toISOString() };
}
export function lockerDto(l: Locker): C.LockerDto { return { id: l.id, locationId: l.locationId, code: l.code, size: l.size as C.LockerSize, status: l.status as C.LockerStatus }; }
export function pricingDto(p: PricingPlan): C.PricingPlanDto { return { id: p.id, locationId: p.locationId, size: p.size as C.LockerSize, period: p.period as C.RentalPeriod, priceCents: p.priceCents }; }
export function locationSummary(l: LocationRow): C.LocationSummaryDto {
  const prices = l.pricingPlans.filter(p => p.period === 'DAILY').map(p => p.priceCents);
  return { id: l.id, partnerId: l.partnerId, partnerName: l.partner.organizationName, name: l.name, campus: l.campus,
    building: l.building, block: l.block, floor: l.floor, reference: l.reference, latitude: l.latitude, longitude: l.longitude,
    openingHours: l.openingHours, photoUrls: JSON.parse(l.photoUrlsJson) as string[], availableCount: l.lockers.filter(k => k.status === 'AVAILABLE').length,
    startingDailyPriceCents: prices.length ? Math.min(...prices) : 0, status: l.status as C.LocationStatus };
}
export function locationDetail(l: LocationRow, includeLockers = true): C.LocationDetailDto {
  const availableBySize: Record<C.LockerSize, number> = { SMALL: 0, MEDIUM: 0, LARGE: 0 };
  l.lockers.filter(k => k.status === 'AVAILABLE').forEach(k => availableBySize[k.size as C.LockerSize]++);
  return { ...locationSummary(l), roomOrCorridor: l.roomOrCorridor, accessInstructions: l.accessInstructions, usageRules: l.usageRules,
    pricingPlans: l.pricingPlans.map(pricingDto), availableBySize, ...(includeLockers ? { lockers: l.lockers.map(lockerDto) } : {}) };
}
export function reservationDto(r: ReservationRow): C.ReservationDto {
  return { id: r.id, userId: r.userId, userName: r.user.name, locationId: r.locationId, locationName: r.location.name,
    buildingSummary: `${r.location.campus} • ${r.location.building} • ${r.location.block} • ${r.location.floor}`,
    accessInstructions: r.location.accessInstructions, lockerId: r.lockerId, lockerCode: r.locker.code, size: r.size as C.LockerSize,
    period: r.period as C.RentalPeriod, startTime: r.startTime.toISOString(), endTime: r.endTime.toISOString(), status: r.status as C.ReservationStatus,
    totalPriceCents: r.totalPriceCents, createdAt: r.createdAt.toISOString() };
}
export function accessDto(e: AccessEvent & { locker: Locker }): C.AccessEventDto {
  return { id: e.id, reservationId: e.reservationId, lockerId: e.lockerId, lockerCode: e.locker.code,
    action: e.action as C.AccessAction, result: e.result as C.AccessResult, message: e.message, createdAt: e.createdAt.toISOString() };
}
export function ticketDto(t: TicketRow): C.SupportTicketDto {
  return { id: t.id, userId: t.userId, userName: t.user.name, reservationId: t.reservationId, lockerCode: t.reservation?.locker.code ?? null,
    category: t.category as C.TicketCategory, priority: t.priority as C.TicketPriority, description: t.description, status: t.status as C.TicketStatus,
    adminNotes: t.adminNotes, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
}
export function revenueDto(r: ReservationRow): C.PartnerRevenueEntryDto {
  return { reservationId: r.id, locationName: r.location.name, lockerCode: r.locker.code, period: r.period as C.RentalPeriod,
    ...splitRevenue(r.totalPriceCents), createdAt: r.createdAt.toISOString() };
}
