import { Injectable } from '@nestjs/common';
import { CreateTicketRequest, UserDto } from '../common/contracts/api.contracts';
import { Store } from '../common/store.service';
import { ticketDto, ticketInclude } from '../common/mappers';
import { ticketPriority } from '../common/domain';
@Injectable()
export class SupportService {
  constructor(private readonly store: Store) {}
  async createTicket(user: UserDto, dto: CreateTicketRequest) {
    await this.store.refreshExpired();
    return this.store.db.atomic(async tx => {
      if (dto.reservationId) {
        const r = await this.store.reservation(tx, user, dto.reservationId);
        if (dto.category === 'ITEMS_TRAPPED' && ['Active', 'Expired'].includes(r.status)) {
          await tx.reservation.update({ where: { id: r.id }, data: { status: 'Incident' } });
        }
      }
      return ticketDto(await tx.supportTicket.create({ data: { ...dto, userId: user.id, priority: ticketPriority(dto.category) }, include: ticketInclude }));
    });
  }
  async listMyTickets(user: UserDto) {
    await this.store.refreshExpired();
    return (await this.store.db.supportTicket.findMany({ where: { userId: user.id }, include: ticketInclude, orderBy: { createdAt: 'desc' } })).map(ticketDto);
  }
}
