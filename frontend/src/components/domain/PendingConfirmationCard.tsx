import { CheckCircle2, Clock, User, XCircle } from 'lucide-react';
import type { ReservationDto } from '../../types/api';
import { formatCents, formatRelative, lockerSizeLabels, periodLabels } from '../../utils/formatters';
import { CopyId, Spinner } from '../ui';

interface Props {
  reservation: ReservationDto;
  busy?: boolean;
  onActivate: (r: ReservationDto) => void;
  onCancel: (r: ReservationDto) => void;
}

/** Pré-reserva aguardando a pessoa chegar ao local: o parceiro ativa ou cancela. */
export function PendingConfirmationCard({ reservation: r, busy, onActivate, onCancel }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-box border border-warning/40 bg-base-100 p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-field bg-warning/15 px-2 text-sm font-bold text-warning-content">
          {r.lockerCode}
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-semibold leading-snug">{r.locationName}</p>
          <p className="flex items-center gap-1 truncate text-sm text-base-content/70">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{r.userName ?? 'Usuário'}</span>
          </p>
        </div>
        <span className="shrink-0 text-right">
          <span className="block font-semibold tabular-nums">{formatCents(r.totalPriceCents)}</span>
          <span className="block text-xs text-base-content/60">{periodLabels[r.period]}</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-base-content/60">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> Pedido {formatRelative(r.createdAt)}
        </span>
        <span>Tamanho {lockerSizeLabels[r.size].toLowerCase()}</span>
        <CopyId id={r.id} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={busy} onClick={() => onCancel(r)} className="btn btn-sm btn-ghost text-error">
          <XCircle className="h-4 w-4" /> Cancelar
        </button>
        <button type="button" disabled={busy} onClick={() => onActivate(r)} className="btn btn-sm btn-primary">
          {busy ? <Spinner /> : <CheckCircle2 className="h-4 w-4" />} Ativar
        </button>
      </div>
    </div>
  );
}
