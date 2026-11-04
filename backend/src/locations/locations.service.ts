import { Injectable, NotFoundException } from '@nestjs/common';
import {
  LocationDetailDto,
  LocationFilters,
  LocationSummaryDto,
  LockerAvailabilityDto,
  LockerDto,
  RentalPeriod,
} from '../common/contracts/api.contracts';
import { LOCKER_HOLDING_STATUSES, MockDbService } from '../common/mock/mock-db.service';

@Injectable()
export class LocationsService {
  constructor(private readonly db: MockDbService) {}

  /**
   * Lista pontos publicados (`ACTIVE`) aplicando filtros de busca.
   *
   * TODO [PLANO-BACKEND]:
   * - Consulta Prisma com `where` dinâmico + contagem de lockers `AVAILABLE`.
   * - Executar o *lazy cleanup* de reservas `PendingPayment` > 15 min antes de contar vagas.
   * - Considerar o parceiro `APPROVED` como condição de publicação.
   */
  findPublicLocations(filters: LocationFilters): LocationSummaryDto[] {
    const search = filters.search?.trim().toLowerCase();

    return this.db.locations
      .filter((location) => location.status === 'ACTIVE')
      .filter((location) => !filters.campus || location.campus === filters.campus)
      .filter((location) => {
        if (!search) return true;
        const haystack = [location.name, location.building, location.block, location.campus, location.reference]
          .join(' ')
          .toLowerCase();
        return haystack.includes(search);
      })
      .filter((location) => {
        if (!filters.size) return true;
        return this.db.lockersOf(location.id).some(
          (l) => l.size === filters.size && (!filters.onlyAvailable || l.status === 'AVAILABLE'),
        );
      })
      .filter((location) => {
        if (filters.maxPriceCents === undefined) return true;
        const period = filters.period ?? 'DAILY';
        return this.db
          .pricingOf(location.id)
          .some(
            (p) =>
              p.period === period &&
              (!filters.size || p.size === filters.size) &&
              p.priceCents <= (filters.maxPriceCents as number),
          );
      })
      .map((location) => this.db.toLocationSummaryDto(location))
      .filter((summary) => !filters.onlyAvailable || summary.availableCount > 0);
  }

  /**
   * Detalhe público do ponto, com planos de preço e vagas por tamanho.
   *
   * TODO [PLANO-BACKEND]: retornar 404 também quando o ponto não estiver `ACTIVE`,
   * exceto para o parceiro dono ou ADMIN (pré-visualização).
   */
  findPublicLocationById(id: string): LocationDetailDto {
    const location = this.db.findLocationById(id);
    if (!location) throw new NotFoundException('Ponto de lockers não encontrado.');
    return this.db.toLocationDetailDto(location);
  }

  /**
   * Compartimentos de um ponto e seus estados operacionais.
   *
   * TODO [PLANO-BACKEND]: ocultar `deviceId` para usuários comuns.
   */
  listLocationLockers(id: string): LockerDto[] {
    if (!this.db.findLocationById(id)) throw new NotFoundException('Ponto de lockers não encontrado.');
    return this.db.lockersOf(id).map((l) => this.db.toLockerDto(l));
  }

  /**
   * Verifica as travas de disponibilidade de um compartimento.
   *
   * TODO [PLANO-BACKEND]: validar também o horário de funcionamento do ponto (regra 5)
   * e bloqueios temporários concorrentes dentro de uma transação.
   */
  checkLockerAvailability(lockerId: string, period: RentalPeriod = 'DAILY'): LockerAvailabilityDto {
    const locker = this.db.findLockerById(lockerId);
    if (!locker) throw new NotFoundException('Locker não encontrado.');
    const location = this.db.findLocationById(locker.locationId);
    const price = this.db.priceFor(locker.locationId, locker.size, period)?.priceCents;

    // 1. Ponto ativo e autorizado
    if (!location || location.status !== 'ACTIVE') {
      return { available: false, reason: 'O ponto não está publicado.' };
    }
    // 2. Locker operacional
    if (locker.status === 'MAINTENANCE' || locker.status === 'BLOCKED') {
      return { available: false, reason: 'Compartimento em manutenção ou bloqueado.' };
    }
    // 3/4. Livre e sem reserva conflitante
    const conflicting = this.db.reservations.some(
      (r) => r.lockerId === locker.id && LOCKER_HOLDING_STATUSES.includes(r.status),
    );
    if (locker.status !== 'AVAILABLE' || conflicting) {
      return { available: false, reason: 'Compartimento ocupado ou reservado.' };
    }
    if (price === undefined) {
      return { available: false, reason: 'Não há preço configurado para este período.' };
    }
    return { available: true, priceCents: price };
  }
}
