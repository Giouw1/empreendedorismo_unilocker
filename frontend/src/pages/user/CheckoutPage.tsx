import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { locationsService } from '../../services/locations.service';
import { reservationsService } from '../../services/reservations.service';
import { useAction, useAsync } from '../../hooks/useAsync';
import { formatCents, lockerSizeLabels, periodLabels } from '../../utils/formatters';
import type { LockerSize, RentalPeriod } from '../../types/api';
import { ErrorAlert, Loading, PageHeader, Spinner } from '../../components/ui';

interface CheckoutState {
  locationId: string;
  size: LockerSize;
  period: RentalPeriod;
}

export default function CheckoutPage() {
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const state = routerLocation.state as CheckoutState | null;
  const { pending, error: submitError, run } = useAction();

  const { data: location, loading, error } = useAsync(
    () => (state?.locationId ? locationsService.getById(state.locationId) : Promise.reject(new Error('Sem seleção'))),
    [state?.locationId],
  );

  if (!state?.locationId) return <Navigate to="/app/explore" replace />;
  if (loading) return <Loading />;
  if (error || !location) return <ErrorAlert message={error ?? 'Ponto inválido'} />;

  const plan = location.pricingPlans.find((p) => p.size === state.size && p.period === state.period);

  const handleConfirm = async () => {
    const created = await run(() =>
      reservationsService.create({
        locationId: location.id,
        size: state.size,
        period: state.period,
      }),
    );
    if (created) {
      navigate(`/app/reservations/${created.id}`, { replace: true });
    }
  };

  return (
    <div className="space-y-4">
      <Link to={`/app/locations/${location.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
        <ArrowLeft className="h-4 w-4" /> Voltar ao ponto
      </Link>

      <PageHeader title="Confirmar reserva" subtitle="Revise os dados antes de ativar seu compartimento" />

      <ErrorAlert message={submitError} />

      <div className="card space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Ponto</span>
          <strong className="text-right">{location.name}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Local</span>
          <span className="text-right text-xs">{location.building} • {location.floor}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Tamanho</span>
          <strong>{lockerSizeLabels[state.size]}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Período</span>
          <strong>{periodLabels[state.period]}</strong>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
          <span className="font-bold">Valor total</span>
          <strong className="text-brand-700">{formatCents(plan?.priceCents)}</strong>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
        <p className="flex items-center gap-1.5 font-bold">
          <CheckCircle2 className="h-4 w-4" /> Ativação imediata (Demonstração MVP)
        </p>
        <p className="mt-1">
          Um compartimento compatível será atribuído automaticamente e liberado para abertura imediata pelo aplicativo.
        </p>
      </div>

      <button type="button" disabled={pending || !plan} onClick={() => void handleConfirm()} className="btn-primary w-full py-3">
        {pending && <Spinner />} Confirmar e ativar locker
      </button>
    </div>
  );
}
