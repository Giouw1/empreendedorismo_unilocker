import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { locationsService } from '../../services/locations.service';
import { reservationsService } from '../../services/reservations.service';
import { useAction, useAsync } from '../../hooks/useAsync';
import type { LockerSize, RentalPeriod } from '../../types/api';
import { ErrorAlert, Loading, PageHeader, Spinner } from '../../components/ui';
import { PriceSummary } from '../../components/domain/PriceSummary';

interface CheckoutState {
  locationId: string;
  size: LockerSize;
  period: RentalPeriod;
  lockerId?: string;
  lockerCode?: string;
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
        lockerId: state.lockerId || undefined,
      }),
    );
    if (created) {
      navigate(`/app/reservations/${created.id}`, { replace: true });
    }
  };

  return (
    <div className="space-y-4">
      <Link
        to={`/app/locations/${location.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao ponto
      </Link>

      <PageHeader
        title="Confirmar reserva"
        subtitle="Revise os detalhes da contratação antes de ativar o guarda-volumes"
      />

      <ErrorAlert message={submitError} />

      {plan && (
        <PriceSummary
          period={state.period}
          size={state.size}
          amountCents={plan.priceCents}
          locationName={location.name}
          lockerCode={state.lockerCode}
        />
      )}

      {/* Regras e Instruções */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2 text-xs text-slate-600">
        <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-brand-600" /> Instruções de uso e horários
        </h4>
        <p>• {location.openingHours ? `Horário do local: ${location.openingHours}` : 'Acesso durante horário acadêmico'}</p>
        <p>• {location.usageRules || 'Não armazene substâncias ilícitas, inflamáveis ou perecíveis.'}</p>
        <p>• Você receberá acesso eletrônico imediato após a confirmação.</p>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 space-y-1">
        <p className="flex items-center gap-1.5 font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Ativação Instantânea (Pitch MVP)
        </p>
        <p className="leading-relaxed">
          Sem necessidade de gateway ou cartão de crédito externo. O aluguel é iniciado imediatamente e a fechadura é liberada no celular.
        </p>
      </div>

      <button
        type="button"
        disabled={pending || !plan}
        onClick={() => void handleConfirm()}
        className="btn-primary w-full py-4 text-base font-black shadow-lg shadow-brand-600/25 active:scale-[0.99] transition-all disabled:opacity-50"
      >
        {pending ? <Spinner /> : <CheckCircle2 className="w-5 h-5 inline mr-2" />}
        Confirmar e Ativar Locker
      </button>
    </div>
  );
}
