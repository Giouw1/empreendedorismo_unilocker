import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AdminDashboardDto,
  AdminReservationFilters,
  LocationDetailDto,
  LocationStatus,
  PartnerDto,
  ReservationDto,
  ResolveIncidentRequest,
  SupportTicketDto,
  TicketStatus,
  UserDto,
} from '../common/contracts/api.contracts';
import {
  LOCKER_HOLDING_STATUSES,
  MockDbService,
  PLATFORM_FEE_RATE,
} from '../common/mock/mock-db.service';

@Injectable()
export class AdminService {
  constructor(private readonly db: MockDbService) {}

  getOverview(): AdminDashboardDto {
    const validRentals = this.db.reservations.filter((r) => r.status !== 'Cancelled');
    const grossRevenueCents = validRentals.reduce((s, r) => s + r.totalPriceCents, 0);
    const platformRevenueCents = Math.round(grossRevenueCents * PLATFORM_FEE_RATE);

    return {
      totalUsers: this.db.users.length,
      activePartners: this.db.partners.filter((p) => p.status === 'APPROVED').length,
      pendingPartners: this.db.partners.filter((p) => p.status === 'PENDING').length,
      totalLocations: this.db.locations.length,
      pendingLocations: this.db.locations.filter((l) => l.status === 'PENDING_APPROVAL').length,
      operationalLockers: this.db.lockers.filter(
        (l) => l.status === 'AVAILABLE' || l.status === 'OCCUPIED',
      ).length,
      activeRentals: this.db.reservations.filter((r) => LOCKER_HOLDING_STATUSES.includes(r.status))
        .length,
      grossRevenueCents,
      platformRevenueCents,
      openIncidents: this.db.supportTickets.filter(
        (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS',
      ).length,
    };
  }

  listUsers(search?: string): UserDto[] {
    const q = search?.trim().toLowerCase();
    return this.db.users
      .filter((u) => {
        if (!q) return true;
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.universityAffiliation.toLowerCase().includes(q)
        );
      })
      .map((u) => this.db.toUserDto(u));
  }

  listPartners(includeAll = false): PartnerDto[] {
    return this.db.partners
      .filter((p) => includeAll || p.status === 'PENDING')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((p) => this.db.toPartnerDto(p));
  }

  reviewPartner(partnerId: string, approved: boolean): PartnerDto {
    const partner = this.db.findPartnerById(partnerId);
    if (!partner) throw new NotFoundException('Solicitação de parceiro não encontrada.');

    partner.status = approved ? 'APPROVED' : 'REJECTED';
    const user = this.db.findUserById(partner.userId);
    if (user) {
      if (approved && !user.roles.includes('PARTNER')) {
        user.roles.push('PARTNER');
      } else if (!approved) {
        user.roles = user.roles.filter((r) => r !== 'PARTNER');
      }
    }
    return this.db.toPartnerDto(partner);
  }

  listAllLocations(status?: LocationStatus): LocationDetailDto[] {
    return this.db.locations
      .filter((l) => !status || l.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((l) => this.db.toLocationDetailDto(l, true));
  }

  reviewLocation(locationId: string, approved: boolean): LocationDetailDto {
    const location = this.db.findLocationById(locationId);
    if (!location) throw new NotFoundException('Ponto não encontrado.');

    if (approved) {
      const partner = this.db.findPartnerById(location.partnerId);
      if (!partner || partner.status !== 'APPROVED') {
        throw new BadRequestException('O ofertador responsável precisa estar aprovado antes de publicar o ponto.');
      }
      if (this.db.lockersOf(location.id).length === 0) {
        throw new BadRequestException('Cadastre ao menos um compartimento antes de publicar o ponto.');
      }
      if (this.db.pricingOf(location.id).length === 0) {
        throw new BadRequestException('Configure ao menos um plano de preço antes de publicar o ponto.');
      }
      location.status = 'ACTIVE';
    } else {
      location.status = 'REJECTED';
    }

    return this.db.toLocationDetailDto(location, true);
  }

  listAllReservations(filters: AdminReservationFilters): ReservationDto[] {
    return this.db.reservations
      .filter((r) => !filters.status || r.status === filters.status)
      .filter((r) => !filters.locationId || r.locationId === filters.locationId)
      .filter((r) => !filters.userId || r.userId === filters.userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => this.db.toReservationDto(r));
  }

  listIncidents(status?: TicketStatus): SupportTicketDto[] {
    return this.db.supportTickets
      .filter((t) => !status || t.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((t) => this.db.toSupportTicketDto(t));
  }

  resolveIncident(ticketId: string, dto: ResolveIncidentRequest): SupportTicketDto {
    const ticket = this.db.supportTickets.find((t) => t.id === ticketId);
    if (!ticket) throw new NotFoundException('Chamado não encontrado.');

    ticket.status = dto.status;
    if (dto.adminNotes !== undefined) ticket.adminNotes = dto.adminNotes.trim() || null;
    ticket.updatedAt = this.db.now();

    if (dto.releaseLocker && ticket.reservationId) {
      const reservation = this.db.findReservationById(ticket.reservationId);
      if (reservation) {
        reservation.status = 'Completed';
        reservation.endTime = this.db.now();
        const locker = this.db.findLockerById(reservation.lockerId);
        if (locker) locker.status = 'AVAILABLE';
      }
    }

    return this.db.toSupportTicketDto(ticket);
  }
}
