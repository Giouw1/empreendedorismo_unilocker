import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, HelpCircle, LockOpen, MapPin, PlusCircle, Power } from 'lucide-react';
import { reservationsService } from '../../services/reservations.service';
import { accessService } from '../../services/access.service';
import { useAction, useAsync } from '../../hooks/useAsync';
import {
  accessResultLabels,
  formatCents,
  formatDateTime,
  formatRemaining,
  lockerSizeLabels,
  periodLabels,
  periodShortLabels,
  RENTAL_PERIODS,
  reservationStatusLabels,
  reservationTone,
} from '../../utils/formatters';
import type { AccessEventDto, RentalPeriod } from '../../types/api';
import { Badge, ErrorAlert, Loading, Spinner, SuccessAlert } from '../../components/ui';

export default function ActiveReservationPage() {
  const { id = '' } = useParams();
  const { data: reservation, loading, error, reload, setData } = useAsync(
    () => reservationsService.getById(id),
    [id],
  );
  const { data: events, reload: reloadEvents } = useAsync(() => accessService.listEvents(id), [id]);

  const unlockAction = useAction();
  const mutateAction = useAction();
  const [lastUnlock, setLastUnlock] = useState<AccessEventDto | null>(null);
  const [confirmedEmpty, setConfirmedEmpty] = useState(false);

  if (loading) return <Loading />;
  if (error || !reservation) return <ErrorAlert message={error ?? 'Reserva não encontrada'} onRetry={() => void reload()} />;

  const isActive = reservation.status === 'Active';

  const handleUnlock = async () => {
    const ev = await unlockAction.run(() => accessService.unlock(reservation.id));
    if (ev) {
      setLastUnlock(ev);
      void reloadEvents();
    }
  };

  const handleExtend = async (additionalPeriod: RentalPeriod) => {
    const updated = await mutateAction.run(() =>
      reservationsService.extend(reservation.id, { additionalPeriod }),
    );
    if (updated) setData(updated);
  };

  const handleComplete = async () => {
    const updated = await mutateAction.run(() =>
      reservationsService.complete(reservation.id, { confirmedEmptyAndClosed: confirmedEmpty }),
    );
    if (updated) setData(updated);
  };

  return (
    <div className="space-y-4">
      <div className="card space-y-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white">
        <div className="flex items-center justify-between">
          <Badge tone={reservationTone(reservation.status)}>
            {reservationStatusLabels[reservation.status]}
          </Badge>
          <span className="text-xs font-semibold text-slate-500">
            {lockerSizeLabels[reservation.size]} • {periodLabels[reservation.period]}
          </span>
        </div>

        <p className="text-3xl font-extrabold text-brand-700">Locker {reservation.lockerCode}</p>
        <p className="text-sm font-semibold text-slate-800">{reservation.locationName}</p>
        <p className="text-xs text-slate-500">{reservation.buildingSummary}</p>

        <div className="flex items-center justify-between border-t border-brand-100 pt-2 text-xs">
          <span className="flex items-center gap-1 font-medium text-slate-700">
            <Clock className="h-3.5 w-3.5 text-brand-600" />
            {isActive ? `Restam ${formatRemaining(reservation.endTime)}` : `Encerrado em ${formatDateTime(reservation.endTime)}`}
          </span>
          <strong className="text-slate-900">{formatCents(reservation.totalPriceCents)}</strong>
        </div>
      </div>

      {/* Controle de Abertura */}
      {isActive && (
        <div className="card space-y-3">
          <button
            type="button"
            disabled={unlockAction.pending}
            onClick={() => void handleUnlock()}
            className="btn-success w-full py-4 text-base shadow-sm"
          >
            {unlockAction.pending ? <Spinner /> : <LockOpen className="h-5 w-5" />}
            Abrir locker {reservation.lockerCode}
          </button>
          <ErrorAlert message={unlockAction.error} />
          {lastUnlock && (
            <SuccessAlert
              message={
                lastUnlock.result === 'CONFIRMED'
                  ? lastUnlock.message
                  : `${accessResultLabels[lastUnlock.result]}: ${lastUnlock.message}`
              }
            />
          )}
        </div>
      )}

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 gap-2">
        <Link to={`/app/reservations/${reservation.id}/locate`} className="btn-secondary text-xs">
          <MapPin className="h-4 w-4" /> Como chegar
        </Link>
        <Link to={`/app/support?reservationId=${reservation.id}`} className="btn-secondary text-xs">
          <HelpCircle className="h-4 w-4" /> Preciso de ajuda
        </Link>
      </div>

      {isActive && (
        <>
          <ErrorAlert message={mutateAction.error} />

          {/* Prorrogar */}
          <div className="card space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-slate-700 uppercase">
              <PlusCircle className="h-4 w-4 text-brand-600" /> Prorrogar aluguel
            </p>
            <div className="grid grid-cols-3 gap-2">
              {RENTAL_PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={mutateAction.pending}
                  onClick={() => void handleExtend(p)}
                  className="btn-secondary py-2 text-xs"
                >
                  {periodShortLabels[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Finalizar */}
          <div className="card space-y-2.5 border-red-100">
            <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-red-700 uppercase">
              <Power className="h-4 w-4" /> Finalizar aluguel
            </p>
            <label className="flex items-start gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={confirmedEmpty}
                onChange={(e) => setConfirmedEmpty(e.target.checked)}
              />
              Confirmo que retirei todos os meus pertences e fechei a porta do compartimento.
            </label>
            <button
              type="button"
              disabled={!confirmedEmpty || mutateAction.pending}
              onClick={() => void handleComplete()}
              className="btn-danger w-full text-xs"
            >
              {mutateAction.pending && <Spinner />} Encerrar e liberar compartimento
            </button>
          </div>
        </>
      )}

      {/* Histórico de Acessos */}
      <div className="card space-y-2">
        <h3 className="text-xs font-bold tracking-wide text-slate-600 uppercase">
          Histórico de aberturas ({events?.length ?? 0})
        </h3>
        {!events?.length ? (
          <p className="text-xs text-slate-400">Nenhuma abertura registrada ainda.</p>
        ) : (
          <ul className="space-y-1.5 text-xs">
            {events.map((ev) => (
              <li key={ev.id} className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span>{accessResultLabels[ev.result]}</span>
                <span className="text-slate-400">{formatDateTime(ev.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
