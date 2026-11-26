import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, HelpCircle, Hourglass, Info, MapPin, PlusCircle, Power } from 'lucide-react';
import { reservationsService } from '../../services/reservations.service';
import { useAction, useAsync } from '../../hooks/useAsync';
import { useCountdown } from '../../hooks/useCountdown';
import {
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
import { Badge, CopyId, ErrorAlert, Loading, SuccessAlert } from '../../components/ui';
import { ConfirmationDialog } from '../../components/domain/ConfirmationDialog';

export default function ActiveReservationPage() {
  const { id = '' } = useParams();
  const { data: reservation, loading, error, reload, setData } = useAsync(() => reservationsService.getById(id), [id]);

  const mutateAction = useAction();
  const [confirmedEmpty, setConfirmedEmpty] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const countdown = useCountdown(reservation?.status === 'Active' ? reservation.endTime : null);

  if (loading) return <Loading />;
  if (error || !reservation) return <ErrorAlert message={error ?? 'Reserva não encontrada'} onRetry={() => void reload()} />;

  const isActive = reservation.status === 'Active';
  const isPending = reservation.status === 'PendingConfirmation';

  const flash = (message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleExtend = async (additionalPeriod: RentalPeriod) => {
    const updated = await mutateAction.run(() => reservationsService.extend(reservation.id, { additionalPeriod }));
    if (updated) {
      setData(updated);
      flash(`Aluguel prorrogado por ${periodShortLabels[additionalPeriod].replace('+', '')}.`);
    }
  };

  const handleComplete = async () => {
    const updated = await mutateAction.run(() => reservationsService.complete(reservation.id, { confirmedEmptyAndClosed: true }));
    if (updated) {
      setData(updated);
      flash('Aluguel finalizado. Compartimento liberado.');
    }
  };

  const handleCancel = async () => {
    const updated = await mutateAction.run(() => reservationsService.cancel(reservation.id));
    if (updated) {
      setData(updated);
      flash(isPending ? 'Pré-reserva cancelada.' : 'Aluguel cancelado.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Link to="/app/reservations" className="inline-flex items-center gap-1.5 text-sm font-medium text-base-content/70 hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Minhas reservas
      </Link>

      {/* Cartão principal */}
      <section className={`panel space-y-3 ${isPending ? 'border-warning/50' : isActive ? 'border-success/50' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge tone={reservationTone(reservation.status)}>{reservationStatusLabels[reservation.status]}</Badge>
          <span className="text-xs font-medium text-base-content/60">
            {lockerSizeLabels[reservation.size]} · {periodLabels[reservation.period]}
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-base-content/50 uppercase">Compartimento</p>
          <p className="text-3xl font-bold tracking-tight text-primary">Locker {reservation.lockerCode}</p>
          <p className="mt-1 font-medium">{reservation.locationName}</p>
          <p className="text-sm text-base-content/60">{reservation.buildingSummary}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-base-300 pt-3 text-sm">
          <span className="flex min-w-0 items-center gap-1.5 font-medium">
            {isPending ? (
              <>
                <Hourglass className="h-4 w-4 shrink-0 text-warning" /> Começa quando o parceiro confirmar
              </>
            ) : isActive ? (
              <>
                <Clock className="h-4 w-4 shrink-0 text-success" />
                {countdown.isExpired ? <span className="text-error">Prazo encerrado</span> : <span className="tabular-nums">Restam {countdown.formatted}</span>}
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 shrink-0 text-base-content/50" /> Encerrado em {formatDateTime(reservation.endTime)}
              </>
            )}
          </span>
          <strong className="text-base tabular-nums">{formatCents(reservation.totalPriceCents)}</strong>
        </div>
        <CopyId id={reservation.id} label="ID da reserva" />
      </section>

      <SuccessAlert message={successMessage} />
      <ErrorAlert message={mutateAction.error} />

      {/* Pré-reserva: o que fazer agora */}
      {isPending && (
        <section className="space-y-2 rounded-box border border-warning/40 bg-warning/10 p-4">
          <h2 className="section-title">
            <Hourglass className="h-4 w-4 text-warning" /> Falta só confirmar no local
          </h2>
          <ol className="list-inside list-decimal space-y-1 text-sm text-base-content/80">
            <li>Vá até {reservation.locationName}.</li>
            <li>
              Procure o responsável e informe o <strong>locker {reservation.lockerCode}</strong> (ou o ID da reserva).
            </li>
            <li>Ele ativa seu aluguel e o período começa a contar a partir daí.</li>
          </ol>
        </section>
      )}

      {/* Acesso ao compartimento */}
      <section className="panel space-y-2">
        <h2 className="section-title">
          <Info className="h-4 w-4 text-primary" /> Como acessar o compartimento
        </h2>
        <p className="text-sm text-base-content/70">
          A chave ou fechadura do <strong>locker {reservation.lockerCode}</strong> é controlada pelo responsável do espaço.
        </p>
        {reservation.accessInstructions && (
          <p className="rounded-field border border-base-300 bg-base-200/50 p-3 text-sm text-base-content/80">{reservation.accessInstructions}</p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-2">
        <Link to={`/app/reservations/${reservation.id}/locate`} className="btn">
          <MapPin className="h-4 w-4 text-primary" /> Como chegar
        </Link>
        <Link to={`/app/support?reservationId=${reservation.id}`} className="btn">
          <HelpCircle className="h-4 w-4" /> Suporte
        </Link>
      </div>

      {isPending && (
        <button type="button" onClick={() => setCancelDialogOpen(true)} className="btn btn-ghost btn-block text-error">
          Cancelar pré-reserva
        </button>
      )}

      {isActive && (
        <div className="space-y-3">
          <section className="panel space-y-3">
            <h2 className="section-title">
              <PlusCircle className="h-4 w-4 text-primary" /> Prorrogar aluguel
            </h2>
            <p className="text-sm text-base-content/60">Continue com o mesmo compartimento por mais tempo.</p>
            <div className="grid grid-cols-3 gap-2">
              {RENTAL_PERIODS.map((p) => (
                <button key={p} type="button" disabled={mutateAction.pending} onClick={() => void handleExtend(p)} className="btn btn-sm">
                  {periodShortLabels[p]}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-box border border-error/30 bg-error/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="section-title text-error">
                <Power className="h-4 w-4" /> Finalizar aluguel
              </h2>
              <button type="button" onClick={() => setCancelDialogOpen(true)} className="link link-hover text-xs text-base-content/60">
                Cancelar reserva
              </button>
            </div>
            <p className="text-sm text-base-content/70">Ao terminar, retire seus objetos e tranque o compartimento.</p>
            <label className="flex cursor-pointer items-start gap-2 rounded-field border border-error/20 bg-base-100 p-3 text-sm">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary mt-0.5 shrink-0"
                checked={confirmedEmpty}
                onChange={(e) => setConfirmedEmpty(e.target.checked)}
              />
              <span className="min-w-0">Confirmo que retirei meus pertences e fechei a porta do compartimento.</span>
            </label>
            <button type="button" disabled={!confirmedEmpty || mutateAction.pending} onClick={() => void handleComplete()} className="btn btn-error btn-block">
              Encerrar e liberar compartimento
            </button>
          </section>
        </div>
      )}

      <ConfirmationDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancel}
        title={isPending ? 'Cancelar pré-reserva?' : 'Cancelar reserva?'}
        description={isPending ? 'O locker volta a ficar disponível para outras pessoas.' : 'Deseja cancelar este aluguel antes de usar o compartimento?'}
        confirmLabel="Sim, cancelar"
        cancelLabel="Voltar"
        variant="warning"
      />
    </div>
  );
}
