import { Injectable } from '@nestjs/common';
import {
  AccessAction,
  AccessEventDto,
  AccessResult,
  LocationDetailDto,
  LocationStatus,
  LocationSummaryDto,
  LockerDto,
  LockerSize,
  LockerStatus,
  PartnerDto,
  PartnerRevenueEntryDto,
  PartnerStatus,
  PricingPlanDto,
  RentalPeriod,
  ReservationDto,
  ReservationStatus,
  SupportTicketDto,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  UserDto,
  UserRole,
} from '../contracts/api.contracts';

/**
 * ============================================================================
 * MockDbService — Armazenamento em memória do Plano 1 (MVP Pitch).
 * ============================================================================
 * Mantém o estado da aplicação em memória para demonstração funcional imediata.
 * TODO [PLANO-BACKEND]: substituir por PrismaService + SQLite (`prisma/dev.db`).
 * ============================================================================
 */

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  universityAffiliation: string;
  roles: UserRole[];
  createdAt: string;
}

export interface PartnerRecord {
  id: string;
  userId: string;
  organizationName: string;
  organizationType: string;
  responsibleName: string;
  contactPhone: string;
  status: PartnerStatus;
  createdAt: string;
}

export interface LocationRecord {
  id: string;
  partnerId: string;
  name: string;
  campus: string;
  building: string;
  block: string;
  floor: string;
  roomOrCorridor: string;
  reference: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  accessInstructions: string;
  usageRules: string;
  photoUrls: string[];
  status: LocationStatus;
  createdAt: string;
}

export interface LockerRecord {
  id: string;
  locationId: string;
  code: string;
  size: LockerSize;
  status: LockerStatus;
}

export interface PricingPlanRecord {
  id: string;
  locationId: string;
  size: LockerSize;
  period: RentalPeriod;
  priceCents: number;
}

export interface ReservationRecord {
  id: string;
  userId: string;
  locationId: string;
  lockerId: string;
  size: LockerSize;
  period: RentalPeriod;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  totalPriceCents: number;
  createdAt: string;
}

export interface AccessEventRecord {
  id: string;
  reservationId: string;
  lockerId: string;
  userId: string;
  action: AccessAction;
  result: AccessResult;
  message: string;
  createdAt: string;
}

export interface SupportTicketRecord {
  id: string;
  userId: string;
  reservationId?: string | null;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
  status: TicketStatus;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const PLATFORM_FEE_RATE = 0.1; // 10% taxa UniLocker, 90% repasse ao Ofertador

export const PERIOD_DURATION_MS: Record<RentalPeriod, number> = {
  DAILY: 24 * 60 * 60 * 1000,
  WEEKLY: 7 * 24 * 60 * 60 * 1000,
  MONTHLY: 30 * 24 * 60 * 60 * 1000,
};

export const LOCKER_HOLDING_STATUSES: ReservationStatus[] = [
  'Active',
  'Expired',
  'Incident',
];

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

@Injectable()
export class MockDbService {
  users: UserRecord[] = [];
  partners: PartnerRecord[] = [];
  locations: LocationRecord[] = [];
  lockers: LockerRecord[] = [];
  pricingPlans: PricingPlanRecord[] = [];
  reservations: ReservationRecord[] = [];
  accessEvents: AccessEventRecord[] = [];
  supportTickets: SupportTicketRecord[] = [];

  private sequence = 1000;

  constructor() {
    this.seed();
  }

  nextId(prefix: string): string {
    this.sequence += 1;
    return `${prefix}-${this.sequence}`;
  }

  now(): string {
    return new Date().toISOString();
  }

  findUserById(id: string) {
    return this.users.find((u) => u.id === id);
  }

  findUserByEmail(email: string) {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findPartnerByUserId(userId: string) {
    return this.partners.find((p) => p.userId === userId);
  }

  findPartnerById(id: string) {
    return this.partners.find((p) => p.id === id);
  }

  findLocationById(id: string) {
    return this.locations.find((l) => l.id === id);
  }

  findLockerById(id: string) {
    return this.lockers.find((l) => l.id === id);
  }

  findReservationById(id: string) {
    return this.reservations.find((r) => r.id === id);
  }

  lockersOf(locationId: string) {
    return this.lockers.filter((l) => l.locationId === locationId);
  }

  pricingOf(locationId: string) {
    return this.pricingPlans.filter((p) => p.locationId === locationId);
  }

  priceFor(locationId: string, size: LockerSize, period: RentalPeriod) {
    return this.pricingPlans.find(
      (p) => p.locationId === locationId && p.size === size && p.period === period,
    );
  }

  toUserDto(user: UserRecord): UserDto {
    const partner = this.findPartnerByUserId(user.id);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      universityAffiliation: user.universityAffiliation,
      roles: [...user.roles],
      partnerId: partner?.id ?? null,
      partnerStatus: partner?.status ?? null,
      createdAt: user.createdAt,
    };
  }

  toPartnerDto(partner: PartnerRecord): PartnerDto {
    return { ...partner };
  }

  toLockerDto(locker: LockerRecord): LockerDto {
    return { ...locker };
  }

  toPricingPlanDto(plan: PricingPlanRecord): PricingPlanDto {
    return { ...plan };
  }

  toLocationSummaryDto(location: LocationRecord): LocationSummaryDto {
    const partner = this.findPartnerById(location.partnerId);
    const lockers = this.lockersOf(location.id);
    const dailyPrices = this.pricingOf(location.id)
      .filter((p) => p.period === 'DAILY')
      .map((p) => p.priceCents);

    return {
      id: location.id,
      partnerId: location.partnerId,
      partnerName: partner?.organizationName ?? '—',
      name: location.name,
      campus: location.campus,
      building: location.building,
      block: location.block,
      floor: location.floor,
      reference: location.reference,
      latitude: location.latitude,
      longitude: location.longitude,
      openingHours: location.openingHours,
      photoUrls: [...location.photoUrls],
      availableCount: lockers.filter((l) => l.status === 'AVAILABLE').length,
      startingDailyPriceCents: dailyPrices.length ? Math.min(...dailyPrices) : 0,
      status: location.status,
    };
  }

  toLocationDetailDto(location: LocationRecord, includeLockers = false): LocationDetailDto {
    const lockers = this.lockersOf(location.id);
    const availableBySize: Record<LockerSize, number> = { SMALL: 0, MEDIUM: 0, LARGE: 0 };
    lockers
      .filter((l) => l.status === 'AVAILABLE')
      .forEach((l) => (availableBySize[l.size] += 1));

    return {
      ...this.toLocationSummaryDto(location),
      roomOrCorridor: location.roomOrCorridor,
      accessInstructions: location.accessInstructions,
      usageRules: location.usageRules,
      pricingPlans: this.pricingOf(location.id).map((p) => this.toPricingPlanDto(p)),
      availableBySize,
      ...(includeLockers ? { lockers: lockers.map((l) => this.toLockerDto(l)) } : {}),
    };
  }

  toReservationDto(reservation: ReservationRecord): ReservationDto {
    const location = this.findLocationById(reservation.locationId);
    const locker = this.findLockerById(reservation.lockerId);
    const user = this.findUserById(reservation.userId);
    return {
      id: reservation.id,
      userId: reservation.userId,
      userName: user?.name,
      locationId: reservation.locationId,
      locationName: location?.name ?? '—',
      buildingSummary: location
        ? `${location.campus} • ${location.building} • ${location.block} • ${location.floor}`
        : '—',
      accessInstructions: location?.accessInstructions ?? '',
      lockerId: reservation.lockerId,
      lockerCode: locker?.code ?? '—',
      size: reservation.size,
      period: reservation.period,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      status: reservation.status,
      totalPriceCents: reservation.totalPriceCents,
      createdAt: reservation.createdAt,
    };
  }

  toAccessEventDto(event: AccessEventRecord): AccessEventDto {
    return {
      id: event.id,
      reservationId: event.reservationId,
      lockerId: event.lockerId,
      lockerCode: this.findLockerById(event.lockerId)?.code ?? '—',
      action: event.action,
      result: event.result,
      message: event.message,
      createdAt: event.createdAt,
    };
  }

  toSupportTicketDto(ticket: SupportTicketRecord): SupportTicketDto {
    const reservation = ticket.reservationId
      ? this.findReservationById(ticket.reservationId)
      : undefined;
    const locker = reservation ? this.findLockerById(reservation.lockerId) : undefined;
    return {
      id: ticket.id,
      userId: ticket.userId,
      userName: this.findUserById(ticket.userId)?.name ?? '—',
      reservationId: ticket.reservationId ?? null,
      lockerCode: locker?.code ?? null,
      category: ticket.category,
      priority: ticket.priority,
      description: ticket.description,
      status: ticket.status,
      adminNotes: ticket.adminNotes ?? null,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  }

  toRevenueEntryDto(reservation: ReservationRecord): PartnerRevenueEntryDto {
    const location = this.findLocationById(reservation.locationId);
    const locker = this.findLockerById(reservation.lockerId);
    const fee = Math.round(reservation.totalPriceCents * PLATFORM_FEE_RATE);
    return {
      reservationId: reservation.id,
      locationName: location?.name ?? '—',
      lockerCode: locker?.code ?? '—',
      period: reservation.period,
      grossAmountCents: reservation.totalPriceCents,
      platformFeeCents: fee,
      partnerNetCents: reservation.totalPriceCents - fee,
      createdAt: reservation.createdAt,
    };
  }

  private seed() {
    const now = Date.now();
    const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();

    this.users = [
      {
        id: 'u-admin',
        name: 'Administração UniLocker',
        email: 'admin@unilocker.ufrj.br',
        password: '123456',
        universityAffiliation: 'Funcionário — Operação UniLocker',
        roles: ['USER', 'ADMIN'],
        createdAt: iso(-90 * DAY),
      },
      {
        id: 'u-guilherme',
        name: 'Prof. Guilherme',
        email: 'guilherme@eba.ufrj.br',
        password: '123456',
        universityAffiliation: 'Professor — Escola de Belas Artes (EBA)',
        roles: ['USER', 'PARTNER'],
        createdAt: iso(-60 * DAY),
      },
      {
        id: 'u-cintra',
        name: 'Cintra',
        email: 'cintra@poli.ufrj.br',
        password: '123456',
        universityAffiliation: 'Aluna — Escola Politécnica (CT)',
        roles: ['USER'],
        createdAt: iso(-45 * DAY),
      },
      {
        id: 'u-joaquim',
        name: 'Joaquim',
        email: 'joaquim@letras.ufrj.br',
        password: '123456',
        universityAffiliation: 'Aluno — Faculdade de Letras',
        roles: ['USER'],
        createdAt: iso(-20 * DAY),
      },
      {
        id: 'u-caeng',
        name: 'Diretoria CAEng',
        email: 'caeng@poli.ufrj.br',
        password: '123456',
        universityAffiliation: 'Centro Acadêmico de Engenharia',
        roles: ['USER', 'PARTNER'],
        createdAt: iso(-80 * DAY),
      },
      {
        id: 'u-caletras',
        name: 'Diretoria CALet',
        email: 'caletras@letras.ufrj.br',
        password: '123456',
        universityAffiliation: 'Centro Acadêmico de Letras',
        roles: ['USER', 'PARTNER'],
        createdAt: iso(-15 * DAY),
      },
      {
        id: 'u-cantina',
        name: 'Cantina do CCMN',
        email: 'cantina@ccmn.ufrj.br',
        password: '123456',
        universityAffiliation: 'Comerciante — CCMN',
        roles: ['USER'],
        createdAt: iso(-3 * DAY),
      },
    ];

    this.partners = [
      {
        id: 'p-guilherme',
        userId: 'u-guilherme',
        organizationName: 'Laboratório de Artes Modernas — EBA',
        organizationType: 'Laboratório',
        responsibleName: 'Prof. Guilherme',
        contactPhone: '(21) 99999-0001',
        status: 'APPROVED',
        createdAt: iso(-58 * DAY),
      },
      {
        id: 'p-caeng',
        userId: 'u-caeng',
        organizationName: 'Centro Acadêmico de Engenharia (CAEng)',
        organizationType: 'Centro Acadêmico',
        responsibleName: 'Diretoria CAEng',
        contactPhone: '(21) 99999-0002',
        status: 'APPROVED',
        createdAt: iso(-78 * DAY),
      },
      {
        id: 'p-caletras',
        userId: 'u-caletras',
        organizationName: 'Centro Acadêmico de Letras (CALet)',
        organizationType: 'Centro Acadêmico',
        responsibleName: 'Diretoria CALet',
        contactPhone: '(21) 99999-0003',
        status: 'APPROVED',
        createdAt: iso(-14 * DAY),
      },
      {
        id: 'p-cantina',
        userId: 'u-cantina',
        organizationName: 'Cantina do CCMN',
        organizationType: 'Restaurante/Lanchonete',
        responsibleName: 'Sr. Antônio',
        contactPhone: '(21) 99999-0004',
        status: 'PENDING',
        createdAt: iso(-2 * DAY),
      },
    ];

    this.locations = [
      {
        id: 'loc-eba',
        partnerId: 'p-guilherme',
        name: 'Laboratório de Artes Modernas — EBA',
        campus: 'Cidade Universitária (Fundão)',
        building: 'Prédio da Reitoria / EBA',
        block: 'Bloco D',
        floor: '7º andar',
        roomOrCorridor: 'Sala 712 — corredor do ateliê',
        reference: 'Ao lado do ateliê de pintura',
        latitude: -22.8622,
        longitude: -43.2234,
        openingHours: 'Seg a Sex, 08:00 às 21:00',
        accessInstructions:
          'Entre pela portaria principal da Reitoria e pegue o elevador até o 7º andar. Siga pelo corredor à esquerda até a sala 712. Os lockers ficam na parede ao lado da porta do laboratório.',
        usageRules:
          'Proibido armazenar alimentos perecíveis ou materiais inflamáveis. Retire seus pertences até o horário de fechamento.',
        photoUrls: [
          'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
          'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
        ],
        status: 'ACTIVE',
        createdAt: iso(-55 * DAY),
      },
      {
        id: 'loc-ct',
        partnerId: 'p-caeng',
        name: 'Hall de Convivência — Bloco A do CT',
        campus: 'Cidade Universitária (Fundão)',
        building: 'Centro de Tecnologia (CT)',
        block: 'Bloco A',
        floor: 'Térreo',
        roomOrCorridor: 'Hall de convivência do CAEng',
        reference: 'Próximo à entrada principal do Bloco A',
        latitude: -22.859,
        longitude: -43.2302,
        openingHours: 'Seg a Sáb, 07:00 às 22:00',
        accessInstructions:
          'Vá até a entrada principal do Bloco A do CT. No térreo, siga pelo corredor à direita da recepção. Os lockers estão no hall de convivência.',
        usageRules:
          'Uso exclusivo para pertences pessoais. Em caso de vencimento, o compartimento permanece retido até regularização.',
        photoUrls: ['https://images.unsplash.com/photo-1562774053-701939374585?w=800'],
        status: 'ACTIVE',
        createdAt: iso(-75 * DAY),
      },
      {
        id: 'loc-letras',
        partnerId: 'p-caletras',
        name: 'Centro Acadêmico — Letras',
        campus: 'Cidade Universitária (Fundão)',
        building: 'Faculdade de Letras',
        block: 'Bloco Único',
        floor: '1º andar',
        roomOrCorridor: 'Sala do CALet',
        reference: 'Em frente à cantina da Letras',
        latitude: -22.8578,
        longitude: -43.2253,
        openingHours: 'Seg a Sex, 09:00 às 20:00',
        accessInstructions:
          'Suba a rampa principal da Faculdade de Letras até o 1º andar. A sala do CALet fica em frente à cantina.',
        usageRules: 'Ideal para eventos e festas universitárias.',
        photoUrls: ['https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800'],
        status: 'PENDING_APPROVAL',
        createdAt: iso(-1 * DAY),
      },
    ];

    const mk = (
      locationId: string,
      code: string,
      size: LockerSize,
      status: LockerStatus = 'AVAILABLE',
    ): LockerRecord => ({
      id: `lk-${locationId.replace('loc-', '')}-${code.toLowerCase()}`,
      locationId,
      code,
      size,
      status,
    });

    this.lockers = [
      mk('loc-eba', 'A-01', 'SMALL', 'OCCUPIED'),
      mk('loc-eba', 'A-02', 'SMALL'),
      mk('loc-eba', 'A-03', 'MEDIUM'),
      mk('loc-eba', 'A-04', 'MEDIUM'),
      mk('loc-eba', 'A-05', 'LARGE'),
      mk('loc-eba', 'A-06', 'LARGE'),
      mk('loc-ct', 'B-01', 'SMALL'),
      mk('loc-ct', 'B-02', 'SMALL'),
      mk('loc-ct', 'B-03', 'SMALL'),
      mk('loc-ct', 'B-04', 'MEDIUM'),
      mk('loc-ct', 'B-05', 'MEDIUM', 'OCCUPIED'),
      mk('loc-ct', 'B-06', 'MEDIUM'),
      mk('loc-ct', 'B-07', 'LARGE'),
      mk('loc-ct', 'B-08', 'LARGE', 'MAINTENANCE'),
      mk('loc-letras', 'C-01', 'SMALL'),
      mk('loc-letras', 'C-02', 'SMALL'),
      mk('loc-letras', 'C-03', 'MEDIUM'),
      mk('loc-letras', 'C-04', 'LARGE'),
    ];

    const table: Record<string, Record<LockerSize, [number, number, number]>> = {
      'loc-eba': { SMALL: [500, 2500, 8000], MEDIUM: [800, 4000, 12000], LARGE: [1200, 6000, 18000] },
      'loc-ct': { SMALL: [600, 3000, 9000], MEDIUM: [900, 4500, 14000], LARGE: [1300, 6500, 20000] },
      'loc-letras': { SMALL: [400, 2000, 7000], MEDIUM: [700, 3500, 11000], LARGE: [1000, 5000, 16000] },
    };
    const periods: RentalPeriod[] = ['DAILY', 'WEEKLY', 'MONTHLY'];
    this.pricingPlans = [];
    Object.entries(table).forEach(([locationId, sizes]) => {
      (Object.keys(sizes) as LockerSize[]).forEach((size) => {
        periods.forEach((period, idx) => {
          this.pricingPlans.push({
            id: `pp-${locationId.replace('loc-', '')}-${size.toLowerCase()}-${period.toLowerCase()}`,
            locationId,
            size,
            period,
            priceCents: sizes[size][idx],
          });
        });
      });
    });

    this.reservations = [
      {
        id: 'res-cintra-active',
        userId: 'u-cintra',
        locationId: 'loc-ct',
        lockerId: 'lk-ct-b-05',
        size: 'MEDIUM',
        period: 'WEEKLY',
        startTime: iso(-2 * DAY),
        endTime: iso(5 * DAY),
        status: 'Active',
        totalPriceCents: 4500,
        createdAt: iso(-2 * DAY),
      },
      {
        id: 'res-eba-active',
        userId: 'u-joaquim',
        locationId: 'loc-eba',
        lockerId: 'lk-eba-a-01',
        size: 'SMALL',
        period: 'WEEKLY',
        startTime: iso(-1 * DAY),
        endTime: iso(6 * DAY),
        status: 'Active',
        totalPriceCents: 2500,
        createdAt: iso(-1 * DAY),
      },
      {
        id: 'res-cintra-old',
        userId: 'u-cintra',
        locationId: 'loc-eba',
        lockerId: 'lk-eba-a-03',
        size: 'MEDIUM',
        period: 'MONTHLY',
        startTime: iso(-35 * DAY),
        endTime: iso(-5 * DAY),
        status: 'Completed',
        totalPriceCents: 12000,
        createdAt: iso(-35 * DAY),
      },
    ];

    this.accessEvents = [
      {
        id: 'ae-seed-1',
        reservationId: 'res-cintra-active',
        lockerId: 'lk-ct-b-05',
        userId: 'u-cintra',
        action: 'UNLOCK_REQUEST',
        result: 'CONFIRMED',
        message: 'Porta destravada pelo aplicativo.',
        createdAt: iso(-2 * DAY + 10 * 60 * 1000),
      },
    ];

    this.supportTickets = [
      {
        id: 'tk-seed-1',
        userId: 'u-cintra',
        reservationId: 'res-cintra-active',
        category: 'OTHER',
        priority: 'LOW',
        description: 'Posso guardar meu notebook de 15" durante todo o fim de semana?',
        status: 'OPEN',
        adminNotes: null,
        createdAt: iso(-1 * DAY),
        updatedAt: iso(-1 * DAY),
      },
    ];
  }
}
