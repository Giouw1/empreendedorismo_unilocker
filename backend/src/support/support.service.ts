import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateTicketRequest,
  SupportTicketDto,
  TicketPriority,
} from '../common/contracts/api.contracts';
import { MockDbService, UserRecord } from '../common/mock/mock-db.service';

@Injectable()
export class SupportService {
  constructor(private readonly db: MockDbService) {}

  /**
   * Cria chamado de suporte com priorização automática em casos críticos.
   *
   * TODO [PLANO-BACKEND]: persistir via Prisma e marcar reserva como `Incident`
   * quando `category === 'ITEMS_TRAPPED'`.
   */
  createTicket(user: UserRecord, dto: CreateTicketRequest): SupportTicketDto {
    if (!dto?.category || !dto?.description?.trim()) {
      throw new BadRequestException('Informe a categoria e descreva o problema.');
    }

    const highCategories = ['LOCKER_WONT_OPEN', 'ITEMS_TRAPPED', 'EXPIRED_RENTAL'];
    const priority: TicketPriority = highCategories.includes(dto.category) ? 'HIGH' : 'MEDIUM';
    const now = this.db.now();

    const ticket = {
      id: this.db.nextId('tk'),
      userId: user.id,
      reservationId: dto.reservationId || null,
      category: dto.category,
      priority,
      description: dto.description.trim(),
      status: 'OPEN' as const,
      adminNotes: null,
      createdAt: now,
      updatedAt: now,
    };

    if (dto.reservationId && dto.category === 'ITEMS_TRAPPED') {
      const reservation = this.db.findReservationById(dto.reservationId);
      if (reservation && reservation.userId === user.id && reservation.status === 'Active') {
        reservation.status = 'Incident';
      }
    }

    this.db.supportTickets.push(ticket);
    return this.db.toSupportTicketDto(ticket);
  }

  listMyTickets(user: UserRecord): SupportTicketDto[] {
    return this.db.supportTickets
      .filter((t) => t.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((t) => this.db.toSupportTicketDto(t));
  }
}
