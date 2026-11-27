import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronRight, Hourglass, ImageOff, Plus } from 'lucide-react';
import { partnerService } from '../../services/partner.service';
import { useAction, useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../contexts/AuthContext';
import { greeting, locationStatusLabels, locationTone } from '../../utils/formatters';
import type { LocationSummaryDto, ReservationDto } from '../../types/api';
import { Badge, EmptyState, ErrorAlert, Loading, SuccessAlert } from '../../components/ui';
import { PendingConfirmationCard } from '../../components/domain/PendingConfirmationCard';
import { ConfirmationDialog } from '../../components/domain/ConfirmationDialog';

function LocationRow({ location }: { location: LocationSummaryDto }) {
  const photo = location.photoUrls[0];
  return (
    <Link
      to={`/partner/locations/${location.id}/lockers`}
      className="flex items-center gap-3 rounded-box border border-base-300 bg-base-100 p-3 shadow-xs transition hover:border-primary/50"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-field bg-base-200">
        {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : <ImageOff className="h-5 w-5 text-base-content/40" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 block font-medium leading-snug">{location.name}</span>
        <span className="block truncate text-sm text-base-content/60">
          {location.campus} · {location.building}
        </span>
        <span className="mt-0.5 block text-xs text-base-content/60">
          {location.availableCount} {location.availableCount === 1 ? 'compartimento livre' : 'compartimentos livres'}
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-base-content/40" />
    </Link>
  );
}

export default function PartnerDashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => partnerService.getDashboard(), []);
  const action = useAction();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toCancel, setToCancel] = useState<ReservationDto | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (loading && !data) return <Loading />;
  if (error || !data) return <ErrorAlert message={error ?? 'Falha ao carregar o painel'} onRetry={() => void reload()} />;

  const firstName = (user?.name ?? '').replace(/^Prof\.?\s+/i, '').split(' ')[0] || user?.name;
  const active = data.locations.filter((l) => l.status === 'ACTIVE');
  const others = data.locations.filter((l) => l.status !== 'ACTIVE');

  const runOn = async (r: ReservationDto, fn: () => Promise<ReservationDto>, message: string) => {
    setBusyId(r.id);
    const done = await action.run(fn);
    setBusyId(null);
    if (done) {
      setSuccess(message);
      window.setTimeout(() => setSuccess(null), 3500);
      await reload();
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">
            {greeting()}, {firstName}!
          </h1>
          <p className="text-sm text-base-content/60">
            {data.pendingConfirmations.length
              ? `${data.pendingConfirmations.length} ${data.pendingConfirmations.length === 1 ? 'pessoa está' : 'pessoas estão'} a caminho dos seus lockers.`
              : 'Tudo em dia por aqui.'}
          </p>
        </div>
        <Link to="/partner/locations/new" className="btn btn-primary">
          <Plus className="h-4 w-4" /> Criar novo ponto
        </Link>
      </header>

      <SuccessAlert message={success} />
      <ErrorAlert message={action.error} />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Pré-reservas aguardando confirmação */}
        <section className="space-y-3 lg:col-span-3" aria-labelledby="pending-title">
          <div className="flex items-center justify-between gap-2">
            <h2 id="pending-title" className="section-title text-base">
              <Hourglass className="h-4 w-4 text-warning" /> Aguardando confirmação
              {!!data.pendingConfirmations.length && <span className="badge badge-warning badge-sm">{data.pendingConfirmations.length}</span>}
            </h2>
            <Link to="/partner/reservations" className="link link-hover text-sm text-primary">
              Ver aluguéis
            </Link>
          </div>
          <p className="text-xs text-base-content/60">
            Ative quando a pessoa chegar ao local. Se ela não aparecer, cancele para liberar o compartimento.
          </p>
          {!data.pendingConfirmations.length ? (
            <EmptyState title="Nenhuma pré-reserva pendente" description="Novas reservas feitas pelo app aparecem aqui." />
          ) : (
            <div className="grid gap-3 xl:grid-cols-2">
              {data.pendingConfirmations.map((r) => (
                <PendingConfirmationCard
                  key={r.id}
                  reservation={r}
                  busy={busyId === r.id}
                  onActivate={(res) => void runOn(res, () => partnerService.activateReservation(res.id), `Locker ${res.lockerCode} ativado. O período começou a contar.`)}
                  onCancel={setToCancel}
                />
              ))}
            </div>
          )}
        </section>

        {/* Pontos ativos */}
        <section className="space-y-3 lg:col-span-2" aria-labelledby="points-title">
          <h2 id="points-title" className="section-title text-base">
            <Building2 className="h-4 w-4 text-primary" /> Pontos ativos
            <span className="badge badge-ghost badge-sm">{active.length}</span>
          </h2>
          {!active.length ? (
            <EmptyState
              title="Nenhum ponto ativo ainda"
              description="Cadastre seu primeiro ponto para começar a receber reservas."
              action={
                <Link to="/partner/locations/new" className="btn btn-primary btn-sm mt-2">
                  <Plus className="h-4 w-4" /> Criar ponto
                </Link>
              }
            />
          ) : (
            <div className="space-y-2">
              {active.map((l) => (
                <LocationRow key={l.id} location={l} />
              ))}
            </div>
          )}

          {!!others.length && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-medium tracking-wide text-base-content/50 uppercase">Outros pontos</h3>
              {others.map((l) => (
                <Link
                  key={l.id}
                  to={`/partner/locations/${l.id}/lockers`}
                  className="flex items-center justify-between gap-3 rounded-box border border-dashed border-base-300 bg-base-100 px-3 py-2 text-sm hover:border-primary/50"
                >
                  <span className="min-w-0 truncate">{l.name}</span>
                  <Badge tone={locationTone(l.status)}>{locationStatusLabels[l.status]}</Badge>
                </Link>
              ))}
            </div>
          )}

          <Link
            to="/partner/locations/new"
            className="flex items-center gap-3 rounded-box border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-primary transition hover:border-primary/60"
          >
            <span className="icon-chip bg-primary text-primary-content">
              <Plus className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold">Criar novo ponto</span>
              <span className="block text-xs text-primary/80">Cadastre um espaço e defina os preços</span>
            </span>
          </Link>
        </section>
      </div>

      <ConfirmationDialog
        isOpen={!!toCancel}
        onClose={() => setToCancel(null)}
        onConfirm={async () => {
          if (toCancel) await runOn(toCancel, () => partnerService.cancelReservation(toCancel.id), `Pré-reserva do locker ${toCancel.lockerCode} cancelada.`);
        }}
        title="Cancelar pré-reserva?"
        description={toCancel ? `${toCancel.userName ?? 'A pessoa'} não poderá mais usar o locker ${toCancel.lockerCode}. O compartimento volta a ficar disponível.` : ''}
        confirmLabel="Cancelar pré-reserva"
        cancelLabel="Voltar"
        variant="danger"
      />
    </div>
  );
}
