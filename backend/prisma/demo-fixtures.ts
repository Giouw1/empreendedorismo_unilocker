
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
} from '../src/common/contracts/api.contracts';

/**
 * ============================================================================
 * Cenários UFRJ do Plano 1, preservados como fixtures exclusivas do seed.
 * ============================================================================
 * O servidor não usa estes arrays: toda persistência operacional utiliza Prisma.
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
  /** Nome público do parceiro responsável pelo ponto e contato direto. */
  hostName: string;
  contactPhone: string;
  contactEmail: string;
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


export class DemoFixtures {
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
      {
        id: 'u-capv',
        name: 'Coordenação do Aulário — PV',
        email: 'aulario@pv.ufrj.br',
        password: '123456',
        universityAffiliation: 'Campus Praia Vermelha — UFRJ',
        roles: ['USER', 'PARTNER'],
        createdAt: iso(-30 * DAY),
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
      {
        id: 'p-aulario-pv',
        userId: 'u-capv',
        organizationName: 'Coordenação do Aulário — Praia Vermelha',
        organizationType: 'Pavilhão de Aulas',
        responsibleName: 'Coordenação Acadêmica PV',
        contactPhone: '(21) 99999-0005',
        status: 'APPROVED',
        createdAt: iso(-25 * DAY),
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
          '/locations/eba-reitoria.jpg',
        ],
        hostName: 'Laboratório de Artes Modernas — Escola de Belas Artes (EBA/UFRJ)',
        contactPhone: '(21) 99999-0001',
        contactEmail: 'lab.artes@eba.ufrj.br',
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
        photoUrls: ['/locations/ct-fachada.jpg'],
        hostName: 'Centro Acadêmico de Engenharia (CAEng) — Escola Politécnica',
        contactPhone: '(21) 99999-0002',
        contactEmail: 'caeng@poli.ufrj.br',
        status: 'ACTIVE',
        createdAt: iso(-75 * DAY),
      },
      {
        id: 'loc-aulario-pv',
        // Ponto operado pelo Prof. Guilherme; a Coordenação do Aulário segue como parceira local do espaço.
        partnerId: 'p-guilherme',
        name: 'Aulário — UFRJ Praia Vermelha',
        campus: 'Praia Vermelha',
        building: 'Pavilhão de Aulas (Aulário)',
        block: 'Bloco Acadêmico',
        floor: '1º andar',
        roomOrCorridor: 'Hall Central do Aulário',
        reference: 'Próximo à entrada do Palácio Universitário e cantina',
        latitude: -22.9537,
        longitude: -43.1751,
        openingHours: 'Seg a Sex, 07:00 às 21:30',
        accessInstructions:
          'Acesso pelo portão principal da Praia Vermelha (Av. Pasteur). Siga em direção ao Aulário / Palácio Universitário. Os lockers ficam no hall central do 1º andar.',
        usageRules:
          'Uso exclusivo para guarda de pertences acadêmicos e pessoais. Manter o compartimento trancado durante o período.',
        photoUrls: [
          '/locations/aulario-praia-vermelha.jpg',
        ],
        hostName: 'Coordenação do Aulário — Campus Praia Vermelha',
        contactPhone: '(21) 99999-0005',
        contactEmail: 'aulario@pv.ufrj.br',
        status: 'ACTIVE',
        createdAt: iso(-20 * DAY),
      },
      {
        id: 'loc-ie-pv',
        partnerId: 'p-guilherme',
        name: 'Instituto de Economia — UFRJ Praia Vermelha',
        campus: 'Praia Vermelha',
        building: 'Instituto de Economia (IE)',
        block: 'Prédio do IE',
        floor: 'Térreo',
        roomOrCorridor: 'Corredor da secretaria de graduação',
        reference: 'Ao lado da secretaria de graduação do IE',
        latitude: -22.9547,
        longitude: -43.1739,
        openingHours: 'Seg a Sex, 08:00 às 21:00',
        accessInstructions:
          'Entre pelo portão principal do campus (Av. Pasteur, 250) e siga até o prédio do Instituto de Economia. No térreo, os lockers ficam no corredor da secretaria de graduação.',
        usageRules:
          'Uso para pertences pessoais e material de estudo. Proibido guardar alimentos perecíveis. Retire seus itens até o fim do período contratado.',
        photoUrls: ['/locations/ie-praia-vermelha.jpg'],
        hostName: 'Instituto de Economia (IE/UFRJ)',
        contactPhone: '(21) 99999-0006',
        contactEmail: 'lockers.ie@ie.ufrj.br',
        status: 'ACTIVE',
        createdAt: iso(-12 * DAY),
      },
      {
        id: 'loc-ifcs',
        partnerId: 'p-guilherme',
        name: 'IFCS — Largo de São Francisco',
        campus: 'Centro',
        building: 'Instituto de Filosofia e Ciências Sociais (IFCS)',
        block: 'Prédio histórico',
        floor: 'Térreo',
        roomOrCorridor: 'Hall de entrada, à direita da portaria',
        reference: 'Largo de São Francisco de Paula, 1 — Centro',
        latitude: -22.9053,
        longitude: -43.1818,
        openingHours: 'Seg a Sex, 07:30 às 22:00',
        accessInstructions:
          'Entre pela portaria principal do IFCS no Largo de São Francisco de Paula. Os lockers ficam no hall de entrada, à direita da portaria.',
        usageRules:
          'Uso exclusivo para pertences pessoais. O prédio é tombado: não cole adesivos nem fixe objetos nos compartimentos.',
        photoUrls: ['/locations/ifcs-largo-sao-francisco.jpg'],
        hostName: 'Instituto de Filosofia e Ciências Sociais (IFCS/UFRJ)',
        contactPhone: '(21) 99999-0007',
        contactEmail: 'lockers.ifcs@ifcs.ufrj.br',
        status: 'ACTIVE',
        createdAt: iso(-8 * DAY),
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
        photoUrls: ['/locations/letras-fachada.jpg'],
        hostName: 'Centro Acadêmico de Letras (CALet)',
        contactPhone: '(21) 99999-0003',
        contactEmail: 'caletras@letras.ufrj.br',
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
      mk('loc-aulario-pv', 'PV-01', 'SMALL'),
      mk('loc-aulario-pv', 'PV-02', 'SMALL'),
      mk('loc-aulario-pv', 'PV-03', 'MEDIUM'),
      mk('loc-aulario-pv', 'PV-04', 'MEDIUM'),
      mk('loc-aulario-pv', 'PV-05', 'LARGE'),
      mk('loc-aulario-pv', 'PV-06', 'LARGE'),
      mk('loc-ie-pv', 'IE-01', 'SMALL'),
      mk('loc-ie-pv', 'IE-02', 'SMALL', 'OCCUPIED'),
      mk('loc-ie-pv', 'IE-03', 'MEDIUM'),
      mk('loc-ie-pv', 'IE-04', 'MEDIUM'),
      mk('loc-ie-pv', 'IE-05', 'LARGE'),
      mk('loc-ifcs', 'FC-01', 'SMALL'),
      mk('loc-ifcs', 'FC-02', 'SMALL'),
      mk('loc-ifcs', 'FC-03', 'MEDIUM', 'OCCUPIED'),
      mk('loc-ifcs', 'FC-04', 'MEDIUM'),
      mk('loc-ifcs', 'FC-05', 'LARGE'),
      mk('loc-letras', 'C-01', 'SMALL'),
      mk('loc-letras', 'C-02', 'SMALL'),
      mk('loc-letras', 'C-03', 'MEDIUM'),
      mk('loc-letras', 'C-04', 'LARGE'),
    ];

    // Mínimos: diário R$ 5, semanal R$ 25, mensal R$ 100. Planos longos sempre custam menos por dia.
    const table: Record<string, Record<LockerSize, [number, number, number]>> = {
      'loc-eba': { SMALL: [500, 2500, 10000], MEDIUM: [800, 4000, 14000], LARGE: [1200, 6000, 20000] },
      'loc-ct': { SMALL: [600, 3000, 10000], MEDIUM: [900, 4500, 15000], LARGE: [1300, 6500, 21000] },
      'loc-aulario-pv': { SMALL: [600, 3000, 10000], MEDIUM: [900, 4500, 15000], LARGE: [1300, 6500, 21000] },
      'loc-ie-pv': { SMALL: [600, 3000, 10000], MEDIUM: [900, 4500, 15000], LARGE: [1300, 6500, 21000] },
      'loc-ifcs': { SMALL: [700, 3200, 11000], MEDIUM: [1000, 4800, 16000], LARGE: [1400, 7000, 22000] },
      'loc-letras': { SMALL: [500, 2500, 10000], MEDIUM: [700, 3500, 12000], LARGE: [1000, 5000, 16000] },
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
        id: 'res-joaquim-pending',
        userId: 'u-joaquim',
        locationId: 'loc-ie-pv',
        lockerId: 'lk-ie-pv-ie-02',
        size: 'SMALL',
        period: 'DAILY',
        startTime: iso(-40 * 60 * 1000),
        endTime: iso(-40 * 60 * 1000 + DAY),
        status: 'PendingConfirmation',
        totalPriceCents: 600,
        createdAt: iso(-40 * 60 * 1000),
      },
      {
        id: 'res-cintra-pending',
        userId: 'u-cintra',
        locationId: 'loc-ifcs',
        lockerId: 'lk-ifcs-fc-03',
        size: 'MEDIUM',
        period: 'WEEKLY',
        startTime: iso(-15 * 60 * 1000),
        endTime: iso(-15 * 60 * 1000 + 7 * DAY),
        status: 'PendingConfirmation',
        totalPriceCents: 4800,
        createdAt: iso(-15 * 60 * 1000),
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
