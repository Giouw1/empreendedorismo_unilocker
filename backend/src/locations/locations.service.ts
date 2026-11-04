import { Injectable, NotFoundException } from '@nestjs/common';
import { LocationFilters, RentalPeriod, UserDto, LockerAvailabilityDto } from '../common/contracts/api.contracts';
import { Store } from '../common/store.service';
import { locationDetail, locationInclude, locationSummary, lockerDto } from '../common/mappers';
@Injectable()
export class LocationsService {
  constructor(private readonly store: Store) {}
  async findPublicLocations(filters: LocationFilters) {
    await this.store.refreshExpired();
    const rows = await this.store.db.location.findMany({ where: { status: 'ACTIVE', partner: { status: 'APPROVED' } }, include: locationInclude, orderBy: { name: 'asc' } });
    const search = filters.search?.trim().toLocaleLowerCase('pt-BR');
    return rows.filter(l => !filters.campus || l.campus === filters.campus)
      .filter(l => !search || [l.name, l.campus, l.building, l.block, l.reference].join(' ').toLocaleLowerCase('pt-BR').includes(search))
      .filter(l => l.lockers.some(k => (!filters.size || k.size === filters.size) && (!filters.onlyAvailable || k.status === 'AVAILABLE') &&
        l.pricingPlans.some(p => p.size === k.size && p.period === (filters.period ?? 'DAILY') && (filters.maxPriceCents === undefined || p.priceCents <= filters.maxPriceCents))))
      .map(locationSummary);
  }
  async readable(id: string, user?: UserDto) {
    const location = await this.store.db.location.findUnique({ where: { id }, include: locationInclude });
    if (!location) throw new NotFoundException('Ponto de lockers não encontrado.');
    const published = location.status === 'ACTIVE' && location.partner.status === 'APPROVED';
    const manager = user?.roles.includes('ADMIN') || (user?.partnerStatus === 'APPROVED' && user.partnerId === location.partnerId);
    if (!published && !manager) throw new NotFoundException('Ponto de lockers não encontrado.');
    return location;
  }
  async findPublicLocationById(id: string, user?: UserDto) { await this.store.refreshExpired(); return locationDetail(await this.readable(id, user)); }
  async listLocationLockers(id: string, user?: UserDto) { await this.store.refreshExpired(); return (await this.readable(id, user)).lockers.map(lockerDto); }
  async checkLockerAvailability(id: string, period: RentalPeriod = 'DAILY'): Promise<LockerAvailabilityDto> {
    await this.store.refreshExpired();
    const locker = await this.store.db.locker.findUnique({ where: { id }, include: { location: { include: { partner: true } } } });
    if (!locker) throw new NotFoundException('Locker não encontrado.');
    if (locker.location.status !== 'ACTIVE' || locker.location.partner.status !== 'APPROVED') return { available: false, reason: 'O ponto não está publicado.' };
    if (locker.status !== 'AVAILABLE' || await this.store.holding(this.store.db, id)) return { available: false, reason: 'Compartimento ocupado, bloqueado ou em manutenção.' };
    const plan = await this.store.db.pricingPlan.findUnique({ where: { locationId_size_period: { locationId: locker.locationId, size: locker.size, period } } });
    return plan ? { available: true, priceCents: plan.priceCents } : { available: false, reason: 'Não há preço configurado para este período.' };
  }
}
