import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AccessResult, UserDto } from '../common/contracts/api.contracts';
import { Store } from '../common/store.service';
import { accessDto } from '../common/mappers';
@Injectable()
export class AccessService {
  constructor(private readonly store: Store) {}
  async requestUnlock(user: UserDto, id: string) {
    await this.store.refreshExpired();
    const outcome = await this.store.db.atomic(async tx => {
      const r = await tx.reservation.findUnique({ where: { id }, include: { locker: true, location: { include: { partner: true } } } });
      if (!r) throw new NotFoundException('Reserva não encontrada.');
      const authorized = r.userId === user.id || user.roles.includes('ADMIN');
      const now = this.store.clock.now();
      let result: AccessResult = 'CONFIRMED';
      let message = `Abertura simulada do compartimento ${r.locker.code} confirmada. Nenhum equipamento real foi acionado.`;
      if (!authorized || r.status !== 'Active' || r.startTime > now || r.endTime <= now ||
        r.location.status !== 'ACTIVE' || r.location.partner.status !== 'APPROVED' || r.locker.status === 'BLOCKED' || r.locker.status === 'AVAILABLE') {
        result = 'UNAUTHORIZED'; message = 'Reserva sem autorização vigente para abertura. Acione o suporte.';
      } else if (r.locker.status === 'MAINTENANCE') {
        result = 'LOCKER_MAINTENANCE'; message = 'Compartimento em manutenção. Acione o suporte.';
      }
      const event = await tx.accessEvent.create({ data: { reservationId: id, lockerId: r.lockerId, userId: user.id,
        action: user.roles.includes('ADMIN') && r.userId !== user.id ? 'EMERGENCY_UNLOCK' : 'UNLOCK_REQUEST', result, message }, include: { locker: true } });
      return { authorized, event: accessDto(event) };
    });
    // A recusa é gravada antes do erro HTTP, sem rollback do evento de auditoria.
    if (!outcome.authorized) throw new ForbiddenException('Você não tem permissão para abrir este compartimento.');
    return outcome.event;
  }
  async listAccessEvents(user: UserDto, id: string) {
    await this.store.reservation(this.store.db, user, id);
    return (await this.store.db.accessEvent.findMany({ where: { reservationId: id }, include: { locker: true }, orderBy: { createdAt: 'desc' } })).map(accessDto);
  }
}
