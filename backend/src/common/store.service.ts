import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserDto } from './contracts/api.contracts';
import { Clock, LOCKER_HOLDING_STATUSES } from './domain';
import { PrismaService } from './prisma/prisma.service';
import { locationInclude, reservationInclude } from './mappers';

@Injectable()
export class Store {
  constructor(readonly db: PrismaService, readonly clock: Clock) {}
  async refreshExpired() {
    await this.db.atomic(async tx => {
      const overdue = await tx.reservation.findMany({ where: { status: 'Active', endTime: { lte: this.clock.now() } } });
      for (const r of overdue) {
        await tx.reservation.update({ where: { id: r.id }, data: { status: 'Expired' } });
        // Retenção explícita: um vencimento nunca disponibiliza o compartimento.
        await tx.locker.update({ where: { id: r.lockerId }, data: { status: 'OCCUPIED' } });
        await tx.supportTicket.upsert({ where: { id: `expired-${r.id}` }, update: {}, create: {
          id: `expired-${r.id}`, userId: r.userId, reservationId: r.id, category: 'EXPIRED_RENTAL', priority: 'HIGH',
          description: 'Aluguel vencido. Compartimento retido até vistoria e liberação administrativa.',
        } });
      }
    });
  }
  async reservation(tx: Prisma.TransactionClient, user: UserDto, id: string, partnerRead = false) {
    const r = await tx.reservation.findUnique({ where: { id }, include: reservationInclude });
    if (!r) throw new NotFoundException('Reserva não encontrada.');
    if (r.userId === user.id || user.roles.includes('ADMIN')) return r;
    if (partnerRead && user.partnerStatus === 'APPROVED' && user.partnerId === r.location.partnerId) return r;
    throw new ForbiddenException('Você não tem acesso a esta reserva.');
  }
  async approvedPartner(tx: Prisma.TransactionClient, user: UserDto) {
    const partner = await tx.partner.findUnique({ where: { userId: user.id } });
    if (!partner || partner.status !== 'APPROVED') throw new ForbiddenException('Conta de parceiro ainda não aprovada.');
    return partner;
  }
  async ownedLocation(tx: Prisma.TransactionClient, user: UserDto, id: string) {
    const partner = await this.approvedPartner(tx, user);
    const location = await tx.location.findUnique({ where: { id }, include: locationInclude });
    if (!location) throw new NotFoundException('Ponto não encontrado.');
    if (location.partnerId !== partner.id) throw new ForbiddenException('Este ponto não pertence à sua organização.');
    return location;
  }
  async holding(tx: Prisma.TransactionClient, lockerId: string) {
    return tx.reservation.count({ where: { lockerId, status: { in: LOCKER_HOLDING_STATUSES } } });
  }
}
