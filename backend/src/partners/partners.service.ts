import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AddLockersRequest,
  CreateLocationRequest,
  LocationDetailDto,
  LockerDto,
  PartnerApplicationRequest,
  PartnerDashboardDto,
  PartnerDto,
  PartnerFinancialSummaryDto,
  PartnerReservationFilters,
  RentalPeriod,
  ReservationDto,
  UpdateLocationRequest,
  UpdateLockerStatusRequest,
} from '../common/contracts/api.contracts';
import {
  LOCKER_HOLDING_STATUSES,
  MockDbService,
  PartnerRecord,
  PLATFORM_FEE_RATE,
  UserRecord,
} from '../common/mock/mock-db.service';

@Injectable()
export class PartnersService {
  constructor(private readonly db: MockDbService) {}

  /**
   * Registra candidatura de novo ofertador (`PENDING`).
   *
   * TODO [PLANO-BACKEND]: persistir via Prisma e notificar administração.
   */
  applyForPartner(user: UserRecord, dto: PartnerApplicationRequest): PartnerDto {
    if (!dto?.organizationName || !dto?.organizationType || !dto?.responsibleName || !dto?.contactPhone) {
      throw new BadRequestException('Preencha todos os dados da organização ofertadora.');
    }
    const existing = this.db.findPartnerByUserId(user.id);
    if (existing) {
      if (existing.status === 'REJECTED') {
        existing.organizationName = dto.organizationName.trim();
        existing.organizationType = dto.organizationType.trim();
        existing.responsibleName = dto.responsibleName.trim();
        existing.contactPhone = dto.contactPhone.trim();
        existing.status = 'PENDING';
        return this.db.toPartnerDto(existing);
      }
      throw new ConflictException('Você já possui um cadastro de parceiro registrado.');
    }

    const partner: PartnerRecord = {
      id: this.db.nextId('p'),
      userId: user.id,
      organizationName: dto.organizationName.trim(),
      organizationType: dto.organizationType.trim(),
      responsibleName: dto.responsibleName.trim(),
      contactPhone: dto.contactPhone.trim(),
      status: 'PENDING',
      createdAt: this.db.now(),
    };
    this.db.partners.push(partner);
    return this.db.toPartnerDto(partner);
  }

  getDashboard(user: UserRecord): PartnerDashboardDto {
    const partner = this.requireApprovedPartner(user);
    const locations = this.db.locations.filter((l) => l.partnerId === partner.id);
    const locationIds = new Set(locations.map((l) => l.id));
    const lockers = this.db.lockers.filter((l) => locationIds.has(l.locationId));
    const reservations = this.db.reservations.filter((r) => locationIds.has(r.locationId));

    const validRentals = reservations.filter((r) => r.status !== 'Cancelled');
    const periodRevenueCents = validRentals.reduce(
      (acc, r) => acc + Math.round(r.totalPriceCents * (1 - PLATFORM_FEE_RATE)),
      0,
    );

    const pendingIncidents = this.db.supportTickets.filter((t) => {
      if (t.status === 'RESOLVED' || t.status === 'CLOSED') return false;
      const res = t.reservationId ? this.db.findReservationById(t.reservationId) : undefined;
      return res && locationIds.has(res.locationId);
    }).length;

    return {
      partner: this.db.toPartnerDto(partner),
      totalLockers: lockers.length,
      occupiedLockers: lockers.filter((l) => l.status === 'OCCUPIED').length,
      availableLockers: lockers.filter((l) => l.status === 'AVAILABLE').length,
      maintenanceLockers: lockers.filter((l) => l.status === 'MAINTENANCE' || l.status === 'BLOCKED').length,
      activeRentals: reservations.filter((r) => LOCKER_HOLDING_STATUSES.includes(r.status)).length,
      periodRevenueCents,
      pendingIncidents,
      locations: locations.map((l) => this.db.toLocationSummaryDto(l)),
    };
  }

  createLocation(user: UserRecord, dto: CreateLocationRequest): LocationDetailDto {
    const partner = this.requireApprovedPartner(user);
    const loc = dto?.locationData;
    if (!loc?.name || !loc?.campus || !loc?.building) {
      throw new BadRequestException('Informe nome, campus e prédio do ponto.');
    }

    const location = {
      id: this.db.nextId('loc'),
      partnerId: partner.id,
      name: loc.name.trim(),
      campus: loc.campus.trim(),
      building: loc.building.trim(),
      block: loc.block?.trim() || 'Bloco Único',
      floor: loc.floor?.trim() || 'Térreo',
      roomOrCorridor: loc.roomOrCorridor?.trim() || 'Corredor principal',
      reference: loc.reference?.trim() || 'Próximo à entrada',
      latitude: Number(loc.latitude ?? -22.8614),
      longitude: Number(loc.longitude ?? -43.2262),
      openingHours: loc.openingHours?.trim() || 'Seg a Sex, 08:00 às 20:00',
      accessInstructions: loc.accessInstructions?.trim() || 'Siga a sinalização interna do prédio.',
      usageRules: loc.usageRules?.trim() || 'Uso exclusivo para pertences pessoais.',
      photoUrls: loc.photoUrls?.length
        ? loc.photoUrls
        : ['https://images.unsplash.com/photo-1562774053-701939374585?w=800'],
      status: 'PENDING_APPROVAL' as const,
      createdAt: this.db.now(),
    };
    this.db.locations.push(location);

    (dto.lockersData ?? []).forEach((item) => {
      this.db.lockers.push({
        id: this.db.nextId('lk'),
        locationId: location.id,
        code: item.code.trim().toUpperCase(),
        size: item.size,
        status: 'AVAILABLE',
      });
    });

    (dto.pricingPlans ?? []).forEach((plan) => {
      if (plan.priceCents > 0) {
        this.db.pricingPlans.push({
          id: this.db.nextId('pp'),
          locationId: location.id,
          size: plan.size,
          period: plan.period,
          priceCents: Math.round(plan.priceCents),
        });
      }
    });

    return this.db.toLocationDetailDto(location, true);
  }

  updateLocation(user: UserRecord, locationId: string, dto: UpdateLocationRequest): LocationDetailDto {
    const partner = this.requireApprovedPartner(user);
    const location = this.db.findLocationById(locationId);
    if (!location) throw new NotFoundException('Ponto não encontrado.');
    if (location.partnerId !== partner.id) {
      throw new ForbiddenException('Este ponto não pertence à sua organização.');
    }

    if (dto.openingHours !== undefined) location.openingHours = dto.openingHours.trim();
    if (dto.accessInstructions !== undefined) location.accessInstructions = dto.accessInstructions.trim();
    if (dto.usageRules !== undefined) location.usageRules = dto.usageRules.trim();

    if (dto.pricingPlans?.length) {
      this.db.pricingPlans = this.db.pricingPlans.filter((p) => p.locationId !== location.id);
      dto.pricingPlans.forEach((plan) => {
        if (plan.priceCents > 0) {
          this.db.pricingPlans.push({
            id: this.db.nextId('pp'),
            locationId: location.id,
            size: plan.size,
            period: plan.period,
            priceCents: Math.round(plan.priceCents),
          });
        }
      });
    }

    return this.db.toLocationDetailDto(location, true);
  }

  addLockers(user: UserRecord, locationId: string, dto: AddLockersRequest): LockerDto[] {
    const partner = this.requireApprovedPartner(user);
    const location = this.db.findLocationById(locationId);
    if (!location) throw new NotFoundException('Ponto não encontrado.');
    if (location.partnerId !== partner.id) {
      throw new ForbiddenException('Este ponto não pertence à sua organização.');
    }
    if (!dto?.lockers?.length) {
      throw new BadRequestException('Informe ao menos um compartimento.');
    }

    const existingCodes = new Set(this.db.lockersOf(location.id).map((l) => l.code.toUpperCase()));
    dto.lockers.forEach((item) => {
      const code = item.code.trim().toUpperCase();
      if (existingCodes.has(code)) {
        throw new ConflictException(`Já existe um compartimento com o código ${code} neste ponto.`);
      }
      existingCodes.add(code);
      this.db.lockers.push({
        id: this.db.nextId('lk'),
        locationId: location.id,
        code,
        size: item.size,
        status: 'AVAILABLE',
      });
    });

    return this.db.lockersOf(location.id).map((l) => this.db.toLockerDto(l));
  }

  updateLockerStatus(user: UserRecord, lockerId: string, dto: UpdateLockerStatusRequest): LockerDto {
    const partner = this.requireApprovedPartner(user);
    const locker = this.db.findLockerById(lockerId);
    if (!locker) throw new NotFoundException('Compartimento não encontrado.');
    const location = this.db.findLocationById(locker.locationId);
    if (!location || location.partnerId !== partner.id) {
      throw new ForbiddenException('Este compartimento não pertence à sua organização.');
    }

    const hasActiveRental = this.db.reservations.some(
      (r) => r.lockerId === locker.id && LOCKER_HOLDING_STATUSES.includes(r.status),
    );
    if (locker.status === 'OCCUPIED' || hasActiveRental) {
      throw new ConflictException(
        'Não é possível alterar o status enquanto houver um aluguel ativo neste compartimento.',
      );
    }

    locker.status = dto.status;
    return this.db.toLockerDto(locker);
  }

  listPartnerReservations(user: UserRecord, filters: PartnerReservationFilters): ReservationDto[] {
    const partner = this.requireApprovedPartner(user);
    const partnerLocationIds = new Set(
      this.db.locations.filter((l) => l.partnerId === partner.id).map((l) => l.id),
    );

    return this.db.reservations
      .filter((r) => partnerLocationIds.has(r.locationId))
      .filter((r) => !filters.locationId || r.locationId === filters.locationId)
      .filter((r) => !filters.status || r.status === filters.status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => this.db.toReservationDto(r));
  }

  getFinancialSummary(user: UserRecord): PartnerFinancialSummaryDto {
    const partner = this.requireApprovedPartner(user);
    const locations = this.db.locations.filter((l) => l.partnerId === partner.id);
    const locationIds = new Set(locations.map((l) => l.id));

    const rentals = this.db.reservations
      .filter((r) => locationIds.has(r.locationId) && r.status !== 'Cancelled')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const entries = rentals.map((r) => this.db.toRevenueEntryDto(r));
    const grossTotalCents = entries.reduce((s, e) => s + e.grossAmountCents, 0);
    const platformCommissionCents = entries.reduce((s, e) => s + e.platformFeeCents, 0);
    const partnerNetTotalCents = entries.reduce((s, e) => s + e.partnerNetCents, 0);

    const revenueByLocation = locations.map((loc) => ({
      locationId: loc.id,
      locationName: loc.name,
      revenueCents: rentals
        .filter((r) => r.locationId === loc.id)
        .reduce((s, r) => s + Math.round(r.totalPriceCents * (1 - PLATFORM_FEE_RATE)), 0),
    }));

    const revenueByPeriod: Record<RentalPeriod, number> = { DAILY: 0, WEEKLY: 0, MONTHLY: 0 };
    rentals.forEach((r) => {
      revenueByPeriod[r.period] += Math.round(r.totalPriceCents * (1 - PLATFORM_FEE_RATE));
    });

    return {
      grossTotalCents,
      platformCommissionCents,
      partnerNetTotalCents,
      totalRentalsCount: rentals.length,
      revenueByLocation,
      revenueByPeriod,
      entries,
    };
  }

  private requireApprovedPartner(user: UserRecord): PartnerRecord {
    const partner = this.db.findPartnerByUserId(user.id);
    if (!partner || partner.status !== 'APPROVED') {
      throw new ForbiddenException('Conta de parceiro ainda não aprovada.');
    }
    return partner;
  }
}
