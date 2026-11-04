import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, ShieldAlert } from 'lucide-react';
import { locationsService } from '../../services/locations.service';
import { useAsync } from '../../hooks/useAsync';
import {
  formatCents,
  LOCKER_SIZES,
  lockerSizeHints,
  lockerSizeLabels,
  periodLabels,
  RENTAL_PERIODS,
} from '../../utils/formatters';
import type { LockerSize, RentalPeriod } from '../../types/api';
import { Badge, ErrorAlert, Loading } from '../../components/ui';

export default function LocationDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: location, loading, error, reload } = useAsync(() => locationsService.getById(id), [id]);

  const [selectedSize, setSelectedSize] = useState<LockerSize>('MEDIUM');
  const [selectedPeriod, setSelectedPeriod] = useState<RentalPeriod>('DAILY');

  if (loading) return <Loading />;
  if (error || !location) return <ErrorAlert message={error ?? 'Ponto não encontrado'} onRetry={() => void reload()} />;

  const selectedPlan = location.pricingPlans.find(
    (p) => p.size === selectedSize && p.period === selectedPeriod,
  );
  const availableForSize = location.availableBySize[selectedSize] ?? 0;

  const handleProceed = () => {
    navigate('/app/checkout', {
      state: {
        locationId: location.id,
        size: selectedSize,
        period: selectedPeriod,
      },
    });
  };

  return (
    <div className="space-y-4">
      <Link to="/app/explore" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
        <ArrowLeft className="h-4 w-4" /> Voltar para explorar
      </Link>

      {location.photoUrls[0] && (
        <img
          src={location.photoUrls[0]}
          alt={location.name}
          className="h-44 w-full rounded-2xl object-cover"
        />
      )}

      <div className="card space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{location.name}</h1>
            <p className="text-xs text-slate-500">Responsável: {location.partnerName}</p>
          </div>
          <Badge tone={location.availableCount > 0 ? 'green' : 'gray'}>
            {location.availableCount} livres
          </Badge>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-slate-600">
          <MapPin className="h-4 w-4 text-brand-600" />
          {location.campus} • {location.building}, {location.block}, {location.floor} ({location.roomOrCorridor})
        </p>
        <p className="flex items-center gap-1.5 text-xs text-slate-600">
          <Clock className="h-4 w-4 text-brand-600" /> {location.openingHours}
        </p>
      </div>

      {/* Seleção de tamanho e período */}
      <div className="card space-y-3">
        <h2 className="text-sm font-bold">1. Escolha o tamanho do compartimento</h2>
        <div className="grid grid-cols-3 gap-2">
          {LOCKER_SIZES.map((size) => {
            const count = location.availableBySize[size] ?? 0;
            const active = selectedSize === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`rounded-xl border p-2.5 text-left transition ${
                  active ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white'
                }`}
              >
                <p className="text-xs font-bold">{lockerSizeLabels[size]}</p>
                <p className="text-[11px] text-slate-500">{lockerSizeHints[size]}</p>
                <p className={`mt-1 text-[11px] font-semibold ${count > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {count} livres
                </p>
              </button>
            );
          })}
        </div>

        <h2 className="pt-1 text-sm font-bold">2. Escolha a modalidade</h2>
        <div className="grid grid-cols-3 gap-2">
          {RENTAL_PERIODS.map((period) => {
            const plan = location.pricingPlans.find((p) => p.size === selectedSize && p.period === period);
            const active = selectedPeriod === period;
            return (
              <button
                key={period}
                type="button"
                onClick={() => setSelectedPeriod(period)}
                className={`rounded-xl border p-2.5 text-left transition ${
                  active ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white'
                }`}
              >
                <p className="text-xs font-bold">{periodLabels[period]}</p>
                <p className="mt-1 text-sm font-extrabold text-brand-700">
                  {plan ? formatCents(plan.priceCents) : '—'}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card space-y-1 text-xs text-slate-600">
        <p className="flex items-center gap-1.5 font-bold text-slate-800">
          <ShieldAlert className="h-4 w-4 text-amber-600" /> Regras de utilização
        </p>
        <p>{location.usageRules}</p>
      </div>

      <button
        type="button"
        disabled={availableForSize === 0 || !selectedPlan}
        onClick={handleProceed}
        className="btn-primary w-full py-3"
      >
        {availableForSize === 0
          ? 'Sem vagas neste tamanho'
          : `Reservar por ${formatCents(selectedPlan?.priceCents)}`}
      </button>
    </div>
  );
}
