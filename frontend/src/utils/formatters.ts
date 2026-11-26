import type {
  AccessResult,
  LocationStatus,
  LockerSize,
  LockerStatus,
  PartnerStatus,
  RentalPeriod,
  ReservationStatus,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  UserRole,
} from '../types/api';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatCents(cents: number | null | undefined): string {
  return brl.format((cents ?? 0) / 100);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR');
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

/** Tempo relativo curto: "agora", "há 5 min", "há 2 h", "há 3 dias". */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '—';
  const min = Math.round(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
}

/** Saudação de acordo com o horário local. */
export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h >= 5 && h < 12) return 'Bom dia';
  if (h >= 12 && h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** ID curto e legível para exibição (o ID completo continua disponível para cópia). */
export function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

/** Status que ainda prendem o compartimento (pré-reserva, ativa, vencida, ocorrência). */
export function isHoldingStatus(status: ReservationStatus): boolean {
  return status === 'PendingConfirmation' || status === 'Active' || status === 'Expired' || status === 'Incident';
}

export function formatRemaining(endIso: string, now: Date = new Date()): string {
  const diffMs = new Date(endIso).getTime() - now.getTime();
  if (Number.isNaN(diffMs)) return '—';
  if (diffMs <= 0) return 'Prazo encerrado';
  const totalMin = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}min`;
  return `${mins} min`;
}

export const roleLabels: Record<UserRole, string> = {
  USER: 'Usuário',
  PARTNER: 'Parceiro',
  ADMIN: 'Administrador',
};

export const partnerStatusLabels: Record<PartnerStatus, string> = {
  PENDING: 'Em análise',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
};

export const locationStatusLabels: Record<LocationStatus, string> = {
  DRAFT: 'Rascunho',
  PENDING_APPROVAL: 'Aguardando aprovação',
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  REJECTED: 'Recusado',
};

export const lockerSizeLabels: Record<LockerSize, string> = {
  SMALL: 'Pequeno',
  MEDIUM: 'Médio',
  LARGE: 'Grande',
};

export const lockerSizeHints: Record<LockerSize, string> = {
  SMALL: 'Documentos, carteira, celular',
  MEDIUM: 'Mochila ou notebook',
  LARGE: 'Mala pequena, equipamentos',
};

export const lockerStatusLabels: Record<LockerStatus, string> = {
  AVAILABLE: 'Disponível',
  OCCUPIED: 'Ocupado',
  MAINTENANCE: 'Manutenção',
  BLOCKED: 'Bloqueado',
};

export const periodLabels: Record<RentalPeriod, string> = {
  DAILY: 'Diário (24h)',
  WEEKLY: 'Semanal (7 dias)',
  MONTHLY: 'Mensal (30 dias)',
};

export const periodShortLabels: Record<RentalPeriod, string> = {
  DAILY: '+1 dia',
  WEEKLY: '+1 semana',
  MONTHLY: '+1 mês',
};

export const reservationStatusLabels: Record<ReservationStatus, string> = {
  PendingConfirmation: 'Aguardando confirmação',
  Active: 'Ativa',
  Completed: 'Finalizada',
  Cancelled: 'Cancelada',
  Expired: 'Vencida',
  Incident: 'Em ocorrência',
};

export const accessResultLabels: Record<AccessResult, string> = {
  CONFIRMED: 'Porta destravada',
  UNAUTHORIZED: 'Acesso não autorizado',
  LOCKER_MAINTENANCE: 'Compartimento em manutenção',
};

export const ticketCategoryLabels: Record<TicketCategory, string> = {
  LOCKER_WONT_OPEN: 'Locker não abre',
  LOCKER_DAMAGED: 'Locker danificado',
  ITEMS_TRAPPED: 'Objetos presos',
  EXPIRED_RENTAL: 'Aluguel vencido',
  OTHER: 'Outro',
};

export const ticketStatusLabels: Record<TicketStatus, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em andamento',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
};

export const ticketPriorityLabels: Record<TicketPriority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
};

export const LOCKER_SIZES: LockerSize[] = ['SMALL', 'MEDIUM', 'LARGE'];
export const RENTAL_PERIODS: RentalPeriod[] = ['DAILY', 'WEEKLY', 'MONTHLY'];
export const RESERVATION_STATUSES: ReservationStatus[] = [
  'PendingConfirmation',
  'Active',
  'Completed',
  'Cancelled',
  'Expired',
  'Incident',
];
export const TICKET_STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
export const TICKET_CATEGORIES: TicketCategory[] = [
  'LOCKER_WONT_OPEN',
  'LOCKER_DAMAGED',
  'ITEMS_TRAPPED',
  'EXPIRED_RENTAL',
  'OTHER',
];
export const LOCATION_STATUSES: LocationStatus[] = [
  'DRAFT',
  'PENDING_APPROVAL',
  'ACTIVE',
  'INACTIVE',
  'REJECTED',
];

export const CAMPUS_OPTIONS: string[] = [
  'Cidade Universitária (Fundão)',
  'Praia Vermelha',
  'Centro',
];

export type BadgeTone = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple';

export function reservationTone(status: ReservationStatus): BadgeTone {
  switch (status) {
    case 'PendingConfirmation':
      return 'yellow';
    case 'Active':
      return 'green';
    case 'Expired':
    case 'Incident':
      return 'red';
    case 'Completed':
      return 'blue';
    default:
      return 'gray';
  }
}

export function lockerTone(status: LockerStatus): BadgeTone {
  switch (status) {
    case 'AVAILABLE':
      return 'green';
    case 'OCCUPIED':
      return 'blue';
    case 'MAINTENANCE':
      return 'purple';
    default:
      return 'red';
  }
}

export function locationTone(status: LocationStatus): BadgeTone {
  switch (status) {
    case 'ACTIVE':
      return 'green';
    case 'PENDING_APPROVAL':
      return 'yellow';
    case 'REJECTED':
      return 'red';
    default:
      return 'gray';
  }
}

export function ticketTone(status: TicketStatus): BadgeTone {
  switch (status) {
    case 'OPEN':
      return 'red';
    case 'IN_PROGRESS':
      return 'yellow';
    case 'RESOLVED':
      return 'green';
    default:
      return 'gray';
  }
}

export function partnerTone(status: PartnerStatus): BadgeTone {
  switch (status) {
    case 'APPROVED':
      return 'green';
    case 'PENDING':
      return 'yellow';
    default:
      return 'red';
  }
}
