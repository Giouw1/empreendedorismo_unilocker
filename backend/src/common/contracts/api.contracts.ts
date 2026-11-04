/**
 * UniLocker — Contrato de API CONGELADO (Plano 1 — Escopo MVP Pitch Investidores).
 *
 * Este arquivo DEVE ser idêntico a `frontend/src/types/api.ts`.
 * Foco nas funcionalidades essenciais da plataforma (sem gateways externos de
 * pagamento/webhooks nem protocolos físicos de hardware).
 *
 * Convenções:
 * - Valores monetários são inteiros em CENTAVOS (`*Cents`).
 * - Datas trafegam como string ISO 8601.
 * - Autenticação: header `Authorization: Bearer <accessToken>`.
 */

// ==================== ENUMS ====================

export type UserRole = 'USER' | 'PARTNER' | 'ADMIN';

export type PartnerStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type LocationStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE' | 'REJECTED';

export type LockerSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export type LockerStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'BLOCKED';

export type RentalPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type ReservationStatus =
  | 'Active'
  | 'Completed'
  | 'Cancelled'
  | 'Expired'
  | 'Incident';

export type AccessAction = 'UNLOCK_REQUEST' | 'EMERGENCY_UNLOCK';

export type AccessResult = 'CONFIRMED' | 'UNAUTHORIZED' | 'LOCKER_MAINTENANCE';

export type TicketCategory =
  | 'LOCKER_WONT_OPEN'
  | 'LOCKER_DAMAGED'
  | 'ITEMS_TRAPPED'
  | 'EXPIRED_RENTAL'
  | 'OTHER';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';

// ==================== ENTIDADES / DTOs DE RESPOSTA ====================

export interface UserDto {
  id: string;
  name: string;
  email: string;
  universityAffiliation: string;
  roles: UserRole[];
  partnerId?: string | null;
  partnerStatus?: PartnerStatus | null;
  createdAt: string;
}

export interface AuthResponseDto {
  accessToken: string;
  user: UserDto;
}

export interface PricingPlanDto {
  id: string;
  locationId: string;
  size: LockerSize;
  period: RentalPeriod;
  priceCents: number;
}

export interface LockerDto {
  id: string;
  locationId: string;
  code: string;
  size: LockerSize;
  status: LockerStatus;
}

export interface LocationSummaryDto {
  id: string;
  partnerId: string;
  partnerName: string;
  name: string;
  campus: string;
  building: string;
  block: string;
  floor: string;
  reference: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  photoUrls: string[];
  availableCount: number;
  startingDailyPriceCents: number;
  status: LocationStatus;
}

export interface LocationDetailDto extends LocationSummaryDto {
  roomOrCorridor: string;
  accessInstructions: string;
  usageRules: string;
  pricingPlans: PricingPlanDto[];
  availableBySize: Record<LockerSize, number>;
  lockers?: LockerDto[];
}

export interface ReservationDto {
  id: string;
  userId: string;
  userName?: string;
  locationId: string;
  locationName: string;
  buildingSummary: string;
  accessInstructions: string;
  lockerId: string;
  lockerCode: string;
  size: LockerSize;
  period: RentalPeriod;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  totalPriceCents: number;
  createdAt: string;
}

export interface AccessEventDto {
  id: string;
  reservationId: string;
  lockerId: string;
  lockerCode: string;
  action: AccessAction;
  result: AccessResult;
  message: string;
  createdAt: string;
}

export interface SupportTicketDto {
  id: string;
  userId: string;
  userName: string;
  reservationId?: string | null;
  lockerCode?: string | null;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
  status: TicketStatus;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerDto {
  id: string;
  userId: string;
  organizationName: string;
  organizationType: string;
  responsibleName: string;
  contactPhone: string;
  status: PartnerStatus;
  createdAt: string;
}

export interface PartnerRevenueEntryDto {
  reservationId: string;
  locationName: string;
  lockerCode: string;
  period: RentalPeriod;
  grossAmountCents: number;
  platformFeeCents: number;
  partnerNetCents: number;
  createdAt: string;
}

export interface PartnerDashboardDto {
  partner: PartnerDto;
  totalLockers: number;
  occupiedLockers: number;
  availableLockers: number;
  maintenanceLockers: number;
  activeRentals: number;
  periodRevenueCents: number;
  pendingIncidents: number;
  locations: LocationSummaryDto[];
}

export interface PartnerFinancialSummaryDto {
  grossTotalCents: number;
  platformCommissionCents: number;
  partnerNetTotalCents: number;
  totalRentalsCount: number;
  revenueByLocation: { locationId: string; locationName: string; revenueCents: number }[];
  revenueByPeriod: Record<RentalPeriod, number>;
  entries: PartnerRevenueEntryDto[];
}

export interface AdminDashboardDto {
  totalUsers: number;
  activePartners: number;
  pendingPartners: number;
  totalLocations: number;
  pendingLocations: number;
  operationalLockers: number;
  activeRentals: number;
  grossRevenueCents: number;
  platformRevenueCents: number;
  openIncidents: number;
}

// ==================== DTOs DE REQUISIÇÃO ====================

// --- Auth / Users ---
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  universityAffiliation: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  name?: string;
  universityAffiliation?: string;
}

// --- Locations ---
export interface LocationFilters {
  campus?: string;
  search?: string;
  size?: LockerSize;
  period?: RentalPeriod;
  maxPriceCents?: number;
  onlyAvailable?: boolean;
}

export interface LockerAvailabilityDto {
  available: boolean;
  reason?: string;
  priceCents?: number;
}

// --- Reservations ---
export interface CreateReservationRequest {
  locationId: string;
  size: LockerSize;
  period: RentalPeriod;
  lockerId?: string;
}

export interface MyReservationsResponse {
  active: ReservationDto[];
  history: ReservationDto[];
}

export interface ExtendReservationRequest {
  additionalPeriod: RentalPeriod;
}

export interface CompleteReservationRequest {
  confirmedEmptyAndClosed: boolean;
}

// --- Partners ---
export interface PartnerApplicationRequest {
  organizationName: string;
  organizationType: string;
  responsibleName: string;
  contactPhone: string;
}

export interface LocationDataInput {
  name: string;
  campus: string;
  building: string;
  block: string;
  floor: string;
  roomOrCorridor: string;
  reference: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  accessInstructions: string;
  usageRules: string;
  photoUrls: string[];
}

export interface LockerInput {
  code: string;
  size: LockerSize;
}

export interface PricingPlanInput {
  size: LockerSize;
  period: RentalPeriod;
  priceCents: number;
}

export interface CreateLocationRequest {
  locationData: LocationDataInput;
  lockersData: LockerInput[];
  pricingPlans: PricingPlanInput[];
}

export interface UpdateLocationRequest {
  openingHours?: string;
  accessInstructions?: string;
  usageRules?: string;
  pricingPlans?: PricingPlanInput[];
}

export interface AddLockersRequest {
  lockers: LockerInput[];
}

export interface UpdateLockerStatusRequest {
  status: 'AVAILABLE' | 'MAINTENANCE' | 'BLOCKED';
}

export interface PartnerReservationFilters {
  locationId?: string;
  status?: ReservationStatus;
}

// --- Support ---
export interface CreateTicketRequest {
  reservationId?: string;
  category: TicketCategory;
  description: string;
}

// --- Admin ---
export interface ReviewRequest {
  approved: boolean;
}

export interface AdminReservationFilters {
  status?: ReservationStatus;
  locationId?: string;
  userId?: string;
}

export interface ResolveIncidentRequest {
  status: TicketStatus;
  adminNotes?: string;
  releaseLocker?: boolean;
}

// ==================== ERROS ====================

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}
