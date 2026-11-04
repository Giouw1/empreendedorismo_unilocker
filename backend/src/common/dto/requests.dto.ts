import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsByteLength, IsDefined, IsEmail, IsIn, IsInt, IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, Length, Max, MaxLength, Min, ValidateIf, ValidateNested } from 'class-validator';
import * as C from '../contracts/api.contracts';
import { CATEGORIES, LOCATION_STATUSES, PERIODS, RESERVATION_STATUSES, SIZES, TICKET_STATUSES } from '../domain';

const trim = Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value);
const optional = () => ValidateIf((_object, value) => value !== undefined);
const booleanQuery = Transform(({ value }: { value: unknown }) => value === 'true' ? true : value === 'false' ? false : value);

export class LoginBody implements C.LoginRequest {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @Length(6, 72) @IsByteLength(0, 72) password!: string;
}
export class RegisterBody extends LoginBody implements C.RegisterRequest {
  @trim @IsString() @Length(2, 120) name!: string;
  @trim @IsString() @Length(2, 200) universityAffiliation!: string;
}
export class ProfileBody implements C.UpdateProfileRequest {
  @optional() @trim @IsString() @Length(2, 120) name?: string;
  @optional() @trim @IsString() @Length(2, 200) universityAffiliation?: string;
}
export class LocationQuery implements C.LocationFilters {
  @optional() @IsString() @MaxLength(120) campus?: string;
  @optional() @IsString() @MaxLength(200) search?: string;
  @optional() @IsIn(SIZES) size?: C.LockerSize;
  @optional() @IsIn(PERIODS) period?: C.RentalPeriod;
  @optional() @Type(() => Number) @IsInt() @Min(0) @Max(2_147_483_647) maxPriceCents?: number;
  @optional() @booleanQuery @IsBoolean() onlyAvailable?: boolean;
}
export class AvailabilityQuery {
  @optional() @IsIn(PERIODS) period?: C.RentalPeriod;
}
export class ReservationBody implements C.CreateReservationRequest {
  @IsString() @Length(1, 128) locationId!: string;
  @IsIn(SIZES) size!: C.LockerSize;
  @IsIn(PERIODS) period!: C.RentalPeriod;
  @optional() @IsString() @Length(1, 128) lockerId?: string;
}
export class ExtendBody implements C.ExtendReservationRequest {
  @IsIn(PERIODS) additionalPeriod!: C.RentalPeriod;
}
export class CompleteBody implements C.CompleteReservationRequest {
  @IsBoolean() confirmedEmptyAndClosed!: boolean;
}
export class ApplicationBody implements C.PartnerApplicationRequest {
  @trim @IsString() @Length(2, 160) organizationName!: string;
  @trim @IsString() @Length(2, 100) organizationType!: string;
  @trim @IsString() @Length(2, 120) responsibleName!: string;
  @trim @IsString() @Length(6, 40) contactPhone!: string;
}
export class LocationDataBody implements C.LocationDataInput {
  @trim @IsString() @Length(2, 160) name!: string;
  @trim @IsString() @Length(2, 120) campus!: string;
  @trim @IsString() @Length(1, 120) building!: string;
  @trim @IsString() @MaxLength(100) block!: string;
  @trim @IsString() @MaxLength(80) floor!: string;
  @trim @IsString() @MaxLength(200) roomOrCorridor!: string;
  @trim @IsString() @MaxLength(300) reference!: string;
  @IsNumber() @IsLatitude() latitude!: number;
  @IsNumber() @IsLongitude() longitude!: number;
  @trim @IsString() @Length(1, 300) openingHours!: string;
  @trim @IsString() @Length(1, 2000) accessInstructions!: string;
  @trim @IsString() @Length(1, 2000) usageRules!: string;
  @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) @MaxLength(2000, { each: true }) photoUrls!: string[];
}
export class LockerBody implements C.LockerInput {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  @IsString() @Length(1, 40) code!: string;
  @IsIn(SIZES) size!: C.LockerSize;
}
export class PricingBody implements C.PricingPlanInput {
  @IsIn(SIZES) size!: C.LockerSize;
  @IsIn(PERIODS) period!: C.RentalPeriod;
  @IsInt() @Min(1) @Max(100_000_000) priceCents!: number;
}
export class CreateLocationBody implements C.CreateLocationRequest {
  @IsDefined() @ValidateNested() @Type(() => LocationDataBody) locationData!: LocationDataBody;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200) @ValidateNested({ each: true }) @Type(() => LockerBody) lockersData!: LockerBody[];
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(9) @ValidateNested({ each: true }) @Type(() => PricingBody) pricingPlans!: PricingBody[];
}
export class UpdateLocationBody implements C.UpdateLocationRequest {
  @optional() @trim @IsString() @Length(1, 300) openingHours?: string;
  @optional() @trim @IsString() @Length(1, 2000) accessInstructions?: string;
  @optional() @trim @IsString() @Length(1, 2000) usageRules?: string;
  @optional() @IsArray() @ArrayMinSize(1) @ArrayMaxSize(9) @ValidateNested({ each: true }) @Type(() => PricingBody) pricingPlans?: PricingBody[];
}
export class AddLockersBody implements C.AddLockersRequest {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200) @ValidateNested({ each: true }) @Type(() => LockerBody) lockers!: LockerBody[];
}
export class LockerStatusBody implements C.UpdateLockerStatusRequest {
  @IsIn(['AVAILABLE', 'MAINTENANCE', 'BLOCKED']) status!: C.UpdateLockerStatusRequest['status'];
}
export class ReservationQuery implements C.AdminReservationFilters {
  @optional() @IsString() @Length(1, 128) locationId?: string;
  @optional() @IsIn(RESERVATION_STATUSES) status?: C.ReservationStatus;
  @optional() @IsString() @Length(1, 128) userId?: string;
}
export class PartnerReservationQuery implements C.PartnerReservationFilters {
  @optional() @IsString() @Length(1, 128) locationId?: string;
  @optional() @IsIn(RESERVATION_STATUSES) status?: C.ReservationStatus;
}
export class TicketBody implements C.CreateTicketRequest {
  @optional() @IsString() @Length(1, 128) reservationId?: string;
  @IsIn(CATEGORIES) category!: C.TicketCategory;
  @trim @IsString() @Length(3, 2000) description!: string;
}
export class ReviewBody implements C.ReviewRequest { @IsBoolean() approved!: boolean; }
export class IncidentBody implements C.ResolveIncidentRequest {
  @IsIn(TICKET_STATUSES) status!: C.TicketStatus;
  @optional() @trim @IsString() @MaxLength(2000) adminNotes?: string;
  @optional() @IsBoolean() releaseLocker?: boolean;
}
export class SearchQuery { @optional() @IsString() @MaxLength(200) search?: string; }
export class PartnersQuery { @optional() @booleanQuery @IsBoolean() includeAll?: boolean; }
export class AdminLocationsQuery { @optional() @IsIn(LOCATION_STATUSES) status?: C.LocationStatus; }
export class IncidentsQuery { @optional() @IsIn(TICKET_STATUSES) status?: C.TicketStatus; }
