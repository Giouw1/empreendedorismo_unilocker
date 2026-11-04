import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as C from '../common/contracts/api.contracts';
import { Store } from '../common/store.service';
import { assertLockerEditable, LOCKER_HOLDING_STATUSES } from '../common/domain';
import { locationDetail, locationInclude, locationSummary, lockerDto, partnerDto, reservationDto, reservationInclude, revenueDto } from '../common/mappers';

@Injectable()
export class PartnersService {
  constructor(private readonly store: Store) {}
  async applyForPartner(user: C.UserDto, dto: C.PartnerApplicationRequest) {
    return this.store.db.atomic(async tx => {
      const previous = await tx.partner.findUnique({ where: { userId: user.id } });
      if (previous && previous.status !== 'REJECTED') throw new ConflictException('Você já possui um cadastro de parceiro registrado.');
      const data = { ...dto, status: 'PENDING' };
      const p = previous ? await tx.partner.update({ where: { id: previous.id }, data }) : await tx.partner.create({ data: { ...data, userId: user.id } });
      return partnerDto(p);
    });
  }
  async getDashboard(user: C.UserDto): Promise<C.PartnerDashboardDto> {
    await this.store.refreshExpired();
    const partner = await this.store.approvedPartner(this.store.db, user);
    const locations = await this.store.db.location.findMany({ where: { partnerId: partner.id }, include: locationInclude });
    const lockers = locations.flatMap(l => l.lockers);
    const rentals = await this.store.db.reservation.findMany({ where: { location: { partnerId: partner.id } }, include: reservationInclude });
    const pendingIncidents = await this.store.db.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, reservation: { location: { partnerId: partner.id } } } });
    return { partner: partnerDto(partner), totalLockers: lockers.length, occupiedLockers: lockers.filter(k => k.status === 'OCCUPIED').length,
      availableLockers: lockers.filter(k => k.status === 'AVAILABLE').length, maintenanceLockers: lockers.filter(k => ['MAINTENANCE', 'BLOCKED'].includes(k.status)).length,
      activeRentals: rentals.filter(r => LOCKER_HOLDING_STATUSES.includes(r.status as C.ReservationStatus)).length,
      periodRevenueCents: rentals.filter(r => r.status !== 'Cancelled').map(revenueDto).reduce((sum, r) => sum + r.partnerNetCents, 0),
      pendingIncidents, locations: locations.map(locationSummary) };
  }
  private validatePlans(lockers: { size: string }[], plans: C.PricingPlanInput[]) {
    const keys = new Set<string>();
    for (const p of plans) {
      const key = `${p.size}:${p.period}`;
      if (keys.has(key)) throw new ConflictException('Há planos duplicados para tamanho e período.');
      keys.add(key);
    }
    for (const size of new Set(lockers.map(k => k.size))) {
      if (!['DAILY', 'WEEKLY', 'MONTHLY'].every(period => keys.has(`${size}:${period}`))) {
        throw new BadRequestException('Configure preços diário, semanal e mensal para cada tamanho cadastrado.');
      }
    }
  }
  async createLocation(user: C.UserDto, dto: C.CreateLocationRequest) {
    this.validatePlans(dto.lockersData, dto.pricingPlans);
    return this.store.db.atomic(async tx => {
      const partner = await this.store.approvedPartner(tx, user);
      const { photoUrls, ...data } = dto.locationData;
      return locationDetail(await tx.location.create({ data: { ...data, photoUrlsJson: JSON.stringify(photoUrls), partnerId: partner.id,
        lockers: { create: dto.lockersData }, pricingPlans: { create: dto.pricingPlans } }, include: locationInclude }));
    });
  }
  async updateLocation(user: C.UserDto, id: string, dto: C.UpdateLocationRequest) {
    return this.store.db.atomic(async tx => {
      const location = await this.store.ownedLocation(tx, user, id);
      const { pricingPlans, ...data } = dto;
      if (pricingPlans) {
        this.validatePlans(location.lockers, pricingPlans);
        await tx.pricingPlan.deleteMany({ where: { locationId: id } });
        await tx.pricingPlan.createMany({ data: pricingPlans.map(p => ({ ...p, locationId: id })) });
      }
      return locationDetail(await tx.location.update({ where: { id }, data, include: locationInclude }));
    });
  }
  async addLockers(user: C.UserDto, id: string, dto: C.AddLockersRequest) {
    return this.store.db.atomic(async tx => {
      const location = await this.store.ownedLocation(tx, user, id);
      // Em ponto publicado, um novo tamanho precisa de tabela de preços já cadastrada.
      if (location.status === 'ACTIVE') this.validatePlans([...location.lockers, ...dto.lockers], location.pricingPlans as C.PricingPlanInput[]);
      await tx.locker.createMany({ data: dto.lockers.map(k => ({ ...k, locationId: id })) });
      return (await tx.locker.findMany({ where: { locationId: id }, orderBy: { code: 'asc' } })).map(lockerDto);
    });
  }
  async updateLockerStatus(user: C.UserDto, id: string, dto: C.UpdateLockerStatusRequest) {
    await this.store.refreshExpired();
    return this.store.db.atomic(async tx => {
      const locker = await tx.locker.findUnique({ where: { id } });
      if (!locker) throw new NotFoundException('Compartimento não encontrado.');
      await this.store.ownedLocation(tx, user, locker.locationId);
      assertLockerEditable(locker.status, (await this.store.holding(tx, id)) > 0);
      return lockerDto(await tx.locker.update({ where: { id }, data: dto }));
    });
  }
  async listPartnerReservations(user: C.UserDto, filters: C.PartnerReservationFilters) {
    await this.store.refreshExpired();
    const p = await this.store.approvedPartner(this.store.db, user);
    return (await this.store.db.reservation.findMany({ where: { ...filters, location: { partnerId: p.id } }, include: reservationInclude, orderBy: { createdAt: 'desc' } })).map(reservationDto);
  }
  async getFinancialSummary(user: C.UserDto): Promise<C.PartnerFinancialSummaryDto> {
    const partner = await this.store.approvedPartner(this.store.db, user);
    const locations = await this.store.db.location.findMany({ where: { partnerId: partner.id } });
    const rentals = await this.store.db.reservation.findMany({ where: { location: { partnerId: partner.id }, status: { not: 'Cancelled' } }, include: reservationInclude, orderBy: { createdAt: 'desc' } });
    const entries = rentals.map(revenueDto);
    const revenueByPeriod: Record<C.RentalPeriod, number> = { DAILY: 0, WEEKLY: 0, MONTHLY: 0 };
    entries.forEach(e => revenueByPeriod[e.period] += e.partnerNetCents);
    return { grossTotalCents: entries.reduce((s, e) => s + e.grossAmountCents, 0), platformCommissionCents: entries.reduce((s, e) => s + e.platformFeeCents, 0),
      partnerNetTotalCents: entries.reduce((s, e) => s + e.partnerNetCents, 0), totalRentalsCount: entries.length,
      revenueByLocation: locations.map(l => ({ locationId: l.id, locationName: l.name, revenueCents: rentals.filter(r => r.locationId === l.id).map(revenueDto).reduce((s, e) => s + e.partnerNetCents, 0) })),
      revenueByPeriod, entries };
  }
}
