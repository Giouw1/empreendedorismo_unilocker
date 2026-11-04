import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as C from '../common/contracts/api.contracts';
import { Store } from '../common/store.service';
import { LOCKER_HOLDING_STATUSES, PERIODS, splitRevenue } from '../common/domain';
import { locationDetail, locationInclude, partnerDto, reservationDto, reservationInclude, rolesOf, ticketDto, ticketInclude, userDto } from '../common/mappers';
@Injectable()
export class AdminService {
  constructor(private readonly store: Store) {}
  async getOverview(): Promise<C.AdminDashboardDto> {
    await this.store.refreshExpired();
    const db = this.store.db;
    const [totalUsers, activePartners, pendingPartners, totalLocations, pendingLocations, operationalLockers, activeRentals, rentals, openIncidents] = await Promise.all([
      db.user.count(), db.partner.count({ where: { status: 'APPROVED' } }), db.partner.count({ where: { status: 'PENDING' } }), db.location.count(),
      db.location.count({ where: { status: 'PENDING_APPROVAL' } }), db.locker.count({ where: { status: { in: ['AVAILABLE', 'OCCUPIED'] } } }),
      db.reservation.count({ where: { status: { in: LOCKER_HOLDING_STATUSES } } }), db.reservation.findMany({ where: { status: { not: 'Cancelled' } } }),
      db.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    ]);
    return { totalUsers, activePartners, pendingPartners, totalLocations, pendingLocations, operationalLockers, activeRentals,
      grossRevenueCents: rentals.reduce((s, r) => s + r.totalPriceCents, 0), platformRevenueCents: rentals.reduce((s, r) => s + splitRevenue(r.totalPriceCents).platformFeeCents, 0), openIncidents };
  }
  async listUsers(search?: string) {
    const q = search?.trim().toLocaleLowerCase('pt-BR');
    return (await this.store.db.user.findMany({ include: { partner: true }, orderBy: { createdAt: 'desc' } }))
      .filter(u => !q || [u.name, u.email, u.universityAffiliation].join(' ').toLocaleLowerCase('pt-BR').includes(q)).map(userDto);
  }
  async listPartners(includeAll = false) { return (await this.store.db.partner.findMany({ where: includeAll ? {} : { status: 'PENDING' }, orderBy: { createdAt: 'desc' } })).map(partnerDto); }
  async reviewPartner(id: string, approved: boolean) {
    return this.store.db.atomic(async tx => {
      const partner = await tx.partner.findUnique({ where: { id }, include: { user: true } });
      if (!partner) throw new NotFoundException('Solicitação de parceiro não encontrada.');
      if (!approved && await tx.reservation.count({ where: { location: { partnerId: id }, status: { in: LOCKER_HOLDING_STATUSES } } })) {
        throw new ConflictException('Regularize os aluguéis retidos antes de rejeitar este parceiro.');
      }
      const roles = new Set(rolesOf(partner.user));
      if (approved) roles.add('PARTNER'); else roles.delete('PARTNER');
      await tx.user.update({ where: { id: partner.userId }, data: { rolesJson: JSON.stringify([...roles]) } });
      return partnerDto(await tx.partner.update({ where: { id }, data: { status: approved ? 'APPROVED' : 'REJECTED' } }));
    });
  }
  async listAllLocations(status?: C.LocationStatus) {
    await this.store.refreshExpired();
    return (await this.store.db.location.findMany({ where: { status }, include: locationInclude, orderBy: { createdAt: 'desc' } })).map(l => locationDetail(l));
  }
  async reviewLocation(id: string, approved: boolean) {
    return this.store.db.atomic(async tx => {
      const location = await tx.location.findUnique({ where: { id }, include: locationInclude });
      if (!location) throw new NotFoundException('Ponto não encontrado.');
      if (approved) {
        if (location.partner.status !== 'APPROVED') throw new BadRequestException('O ofertador precisa estar aprovado.');
        if (!location.lockers.some(k => k.status === 'AVAILABLE' || k.status === 'OCCUPIED')) throw new BadRequestException('Cadastre ao menos um compartimento operacional.');
        for (const size of new Set(location.lockers.map(k => k.size))) {
          if (!PERIODS.every(period => location.pricingPlans.some(p => p.size === size && p.period === period && p.priceCents > 0))) {
            throw new BadRequestException('Configure os três períodos de preço para cada tamanho de locker.');
          }
        }
      } else if (await tx.reservation.count({ where: { locationId: id, status: { in: LOCKER_HOLDING_STATUSES } } })) {
        throw new ConflictException('Regularize os aluguéis retidos antes de rejeitar este ponto.');
      }
      return locationDetail(await tx.location.update({ where: { id }, data: { status: approved ? 'ACTIVE' : 'REJECTED' }, include: locationInclude }));
    });
  }
  async listAllReservations(filters: C.AdminReservationFilters) {
    await this.store.refreshExpired();
    return (await this.store.db.reservation.findMany({ where: filters, include: reservationInclude, orderBy: { createdAt: 'desc' } })).map(reservationDto);
  }
  async listIncidents(status?: C.TicketStatus) {
    await this.store.refreshExpired();
    return (await this.store.db.supportTicket.findMany({ where: { status }, include: ticketInclude, orderBy: { createdAt: 'desc' } })).map(ticketDto);
  }
  async resolveIncident(id: string, dto: C.ResolveIncidentRequest) {
    await this.store.refreshExpired();
    return this.store.db.atomic(async tx => {
      const ticket = await tx.supportTicket.findUnique({ where: { id }, include: ticketInclude });
      if (!ticket) throw new NotFoundException('Chamado não encontrado.');
      if (dto.releaseLocker) {
        const r = ticket.reservation;
        if (!r || !LOCKER_HOLDING_STATUSES.includes(r.status as C.ReservationStatus)) throw new ConflictException('Chamado sem aluguel retido para liberar.');
        if (!['RESOLVED', 'CLOSED'].includes(dto.status)) throw new BadRequestException('Conclua a ocorrência para confirmar a vistoria e liberar o locker.');
        await tx.reservation.update({ where: { id: r.id }, data: { status: 'Completed', endTime: this.store.clock.now() } });
        await tx.locker.update({ where: { id: r.lockerId }, data: { status: 'AVAILABLE' } });
      }
      return ticketDto(await tx.supportTicket.update({ where: { id }, data: { status: dto.status, ...(dto.adminNotes !== undefined ? { adminNotes: dto.adminNotes || null } : {}) }, include: ticketInclude }));
    });
  }
}
