import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, HelpCircle, MapPin, PlusCircle, Power, History } from 'lucide-react';
import { reservationsService } from '../../services/reservations.service';
import { accessService } from '../../services/access.service';
import { useAction, useAsync } from '../../hooks/useAsync';
import { useCountdown } from '../../hooks/useCountdown';
import {
  accessResultLabels,
  formatCents,
  formatDateTime,
  lockerSizeLabels,
  periodLabels,
  periodShortLabels,
  RENTAL_PERIODS,
  reservationStatusLabels,
  reservationTone,
} from '../../utils/formatters';
import type { RentalPeriod } from '../../types/api';
import { Badge, ErrorAlert, Loading, SuccessAlert } from '../../components/ui';
import { AccessButton } from '../../components/domain/AccessButton';
import { ConfirmationDialog } from '../../components/domain/ConfirmationDialog';

export default function ActiveReservationPage() {
  const { id = '' } = useParams();
  const { data: reservation, loading, error, reload, setData } = useAsync(
    () => reservationsService.getById(id),
    [id],
  );
  const { data: events, reload: reloadEvents } = useAsync(() => accessService.listEvents(id), [id]);

  const mutateAction = useAction();
  const [confirmedEmpty, setConfirmedEmpty] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const countdown = useCountdown(reservation?.endTime);

  if (loading) return <Loading />;
  if (error || !reservation) return <ErrorAlert message={error ?? 'Reserva não encontrada'} onRetry={() => void reload()} />;

  const isActive = reservation.status === 'Active';

  const handleUnlock = async () => {
    const ev = await accessService.unlock(reservation.id);
    void reloadEvents();
    if (ev.result !== 'CONFIRMED') {
      throw new Error(`${accessResultLabels[ev.result] || 'Falha'}: ${ev.message}`);
    }
  };

  const handleExtend = async (additionalPeriod: RentalPeriod) => {
    const updated = await mutateAction.run(() =>
      reservationsService.extend(reservation.id, { additionalPeriod }),
    );
    if (updated) {
      setData(updated);
      setSuccessMessage(`Aluguel prorrogado com sucesso por ${periodShortLabels[additionalPeriod]}!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleComplete = async () => {
    const updated = await mutateAction.run(() =>
      reservationsService.complete(reservation.id, { confirmedEmptyAndClosed: true }),
    );
    if (updated) {
      setData(updated);
      setSuccessMessage('Aluguel finalizado com sucesso! Compartimento liberado.');
    }
  };

  const handleCancel = async () => {
    const updated = await mutateAction.run(() => reservationsService.cancel(reservation.id));
    if (updated) {
      setData(updated);
      setSuccessMessage('Aluguel cancelado.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Card Principal da Reserva */}
      <div className="card space-y-3 border-brand-200 bg-gradient-to-br from-brand-50/70 via-white to-slate-50 shadow-sm">
        <div className="flex items-center justify-between">
          <Badge tone={reservationTone(reservation.status)}>
            {reservationStatusLabels[reservation.status]}
          </Badge>
          <span className="text-xs font-semibold text-slate-500">
            {lockerSizeLabels[reservation.size]} • {periodLabels[reservation.period]}
          </span>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Compartimento
          </span>
          <p className="text-3xl font-black text-brand-700 tracking-tight">
            Locker {reservation.lockerCode}
          </p>
          <p className="text-sm font-bold text-slate-800 mt-1">{reservation.locationName}</p>
          <p className="text-xs text-slate-500">{reservation.buildingSummary}</p>
        </div>

        {/* Cronômetro Regressivo ao Vivo */}
        <div className="flex items-center justify-between border-t border-brand-100/80 pt-3 text-xs">
          <span className="flex items-center gap-1.5 font-bold text-slate-700">
            <Clock className="h-4 w-4 text-brand-600" />
            {isActive ? (
              countdown.isExpired ? (
                <span className="text-rose-600 font-extrabold animate-pulse">Prazo encerrado</span>
              ) : (
                <span className="font-mono text-emerald-700">Restam {countdown.formatted}</span>
              )
            ) : (
              `Encerrado em ${formatDateTime(reservation.endTime)}`
            )}
          </span>
          <strong className="text-slate-900 font-extrabold text-sm">
            {formatCents(reservation.totalPriceCents)}
          </strong>
        </div>
      </div>

      {successMessage && <SuccessAlert message={successMessage} />}
      <ErrorAlert message={mutateAction.error} />

      {/* Botão de Acesso Eletrônico Animado */}
      {isActive && (
        <div className="py-1">
          <AccessButton
            lockerCode={reservation.lockerCode}
            onOpen={handleUnlock}
            disabled={countdown.isExpired}
          />
        </div>
      )}

      {/* Ações Rápidas de Apoio */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          to={`/app/reservations/${reservation.id}/locate`}
          className="btn-secondary text-xs flex items-center justify-center gap-1.5 py-2.5 font-semibold"
        >
          <MapPin className="h-4 w-4 text-brand-600" /> Como chegar
        </Link>
        <Link
          to={`/app/support?reservationId=${reservation.id}`}
          className="btn-secondary text-xs flex items-center justify-center gap-1.5 py-2.5 font-semibold"
        >
          <HelpCircle className="h-4 w-4 text-slate-500" /> Suporte
        </Link>
      </div>

      {/* Gerenciamento do Aluguel (Prorrogar / Finalizar / Cancelar) */}
      {isActive && (
        <div className="space-y-3">
          {/* Prorrogação */}
          <div className="card space-y-2.5">
            <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-slate-700 uppercase">
              <PlusCircle className="h-4 w-4 text-brand-600" /> Prorrogar aluguel
            </p>
            <p className="text-xs text-slate-500">
              Estenda o período de uso mantendo o mesmo compartimento:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {RENTAL_PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={mutateAction.pending}
                  onClick={() => void handleExtend(p)}
                  className="btn-secondary py-2.5 text-xs font-bold hover:border-brand-500 hover:text-brand-600 transition-all"
                >
                  {periodShortLabels[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Encerramento com Confirmação */}
          <div className="card space-y-3 border-rose-100 bg-rose-50/30">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-rose-700 uppercase">
                <Power className="h-4 w-4 text-rose-600" /> Finalizar aluguel
              </p>
              <button
                type="button"
                onClick={() => setCancelDialogOpen(true)}
                className="text-[11px] text-slate-400 hover:text-slate-600 underline"
              >
                Cancelar reserva
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Ao terminar, retire todos os seus objetos pessoais e tranque o armário.
            </p>
            <label className="flex items-start gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-white p-2.5 rounded-xl border border-rose-200">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                checked={confirmedEmpty}
                onChange={(e) => setConfirmedEmpty(e.target.checked)}
              />
              <span>Confirmo que retirei todos os meus pertences e fechei a porta do compartimento.</span>
            </label>
            <button
              type="button"
              disabled={!confirmedEmpty || mutateAction.pending}
              onClick={() => void handleComplete()}
              className="btn-danger w-full py-2.5 text-xs font-bold"
            >
              Encerrar e liberar compartimento
            </button>
          </div>
        </div>
      )}

      {/* Modal de Cancelamento */}
      <ConfirmationDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancel}
        title="Cancelar Reserva"
        description="Deseja realmente cancelar este aluguel antes da utilização?"
        confirmLabel="Sim, Cancelar"
        variant="warning"
      />

      {/* Histórico de Aberturas do Compartimento */}
      <div className="card space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-wide text-slate-700 uppercase flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-slate-500" /> Histórico de aberturas ({events?.length ?? 0})
          </h3>
          <span className="text-[11px] text-slate-400">Auditoria eletrônica</span>
        </div>

        {!events?.length ? (
          <p className="text-xs text-slate-400 py-2 text-center">Nenhuma abertura registrada ainda.</p>
        ) : (
          <ul className="space-y-2 text-xs divide-y divide-slate-100">
            {events.map((ev) => (
              <li key={ev.id} className="pt-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800">
                    {accessResultLabels[ev.result] || ev.result}
                  </span>
                  {ev.message && <span className="text-slate-500 block text-[11px]">{ev.message}</span>}
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  {formatDateTime(ev.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
