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
    <div className="mx-auto w-full max-w-xl space-y-4">
      <Link to={`/app/locations/${location.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-base-content/70 hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Voltar ao ponto
      </Link>

      <PageHeader title="Confirmar pré-reserva" subtitle="Revise os detalhes. O aluguel começa quando o parceiro confirmar sua chegada no local." />

      <ErrorAlert message={submitError} />

      {plan && (
        <PriceSummary period={state.period} size={state.size} amountCents={plan.priceCents} locationName={location.name} lockerCode={state.lockerCode} />
      )}

      <section className="panel space-y-2 text-sm text-base-content/70">
        <h2 className="section-title">
          <ShieldCheck className="h-4 w-4 text-primary" /> Antes de confirmar
        </h2>
        <ul className="list-inside list-disc space-y-1">
          <li>{location.openingHours ? `Horário do local: ${location.openingHours}` : 'Acesso durante o horário acadêmico.'}</li>
          <li>{location.usageRules || 'Não guarde itens ilícitos, inflamáveis ou perecíveis.'}</li>
          <li>O pagamento e a entrega da chave são feitos no local, com {location.partnerName}.</li>
        </ul>
      </section>

      <button type="button" disabled={pending || !plan} onClick={() => void handleConfirm()} className="btn btn-primary btn-lg btn-block">
        {pending ? <Spinner /> : <CheckCircle2 className="h-5 w-5" />}
        Confirmar pré-reserva
      </button>
    </div>
  );
}
