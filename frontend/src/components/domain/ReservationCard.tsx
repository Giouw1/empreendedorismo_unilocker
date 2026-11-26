import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Hourglass, KeyRound, MapPin, Navigation } from 'lucide-react';
import type { ReservationDto } from '../../types/api';
import { formatCents, formatDate, periodLabels, reservationStatusLabels, reservationTone } from '../../utils/formatters';
import { Badge, CopyId } from '../ui';

export function ReservationCard({ reservation: r, className = '' }: { reservation: ReservationDto; className?: string }) {
  const isActive = r.status === 'Active';
  const isPending = r.status === 'PendingConfirmation';

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-box border bg-base-100 shadow-xs transition hover:shadow-md ${
        isActive ? 'border-success/50 ring-2 ring-success/10' : isPending ? 'border-warning/50' : 'border-base-300'
      } ${className}`}
    >
      <div className="flex-1 space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-field bg-primary/10 px-1.5 text-sm font-bold whitespace-nowrap text-primary">
              {r.lockerCode}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Locker {r.lockerCode}</p>
              <p className="truncate text-xs text-base-content/60">
                {periodLabels[r.period]} · {formatCents(r.totalPriceCents)}
              </p>
            </div>
          </div>
          <Badge tone={reservationTone(r.status)}>{reservationStatusLabels[r.status]}</Badge>
        </div>

        <div className="space-y-1 rounded-field border border-base-300 bg-base-200/50 p-3 text-xs">
          <p className="flex items-center gap-1.5 font-medium">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">{r.locationName}</span>
          </p>
          <p className="line-clamp-2 pl-5 text-base-content/60">{r.buildingSummary}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-base-content/60">
          {isPending ? (
            <span className="flex items-center gap-1 text-warning-content">
              <Hourglass className="h-3.5 w-3.5" /> Confirme no local para começar
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Válido até <strong className="font-medium text-base-content">{formatDate(r.endTime)}</strong>
            </span>
          )}
          <CopyId id={r.id} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-base-300 bg-base-200/40 px-4 py-2.5">
        <Link to={`/app/reservations/${r.id}/locate`} className="inline-flex items-center gap-1 text-xs font-medium text-base-content/70 hover:text-primary">
          <Navigation className="h-3.5 w-3.5" /> Como chegar
        </Link>
        {isActive || isPending ? (
          <Link to={`/app/reservations/${r.id}`} className={`btn btn-xs ${isActive ? 'btn-success' : 'btn-warning'}`}>
            <KeyRound className="h-3.5 w-3.5" /> Ver reserva
          </Link>
        ) : (
          <Link to={`/app/reservations/${r.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary">
            Detalhes <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </article>
  );
}
