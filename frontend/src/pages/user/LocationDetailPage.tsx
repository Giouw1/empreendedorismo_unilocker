import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, ShieldAlert, Building2, CheckCircle2 } from 'lucide-react';
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
import type { LockerSize, RentalPeriod, LockerDto } from '../../types/api';
import { Badge, ErrorAlert, Loading } from '../../components/ui';
import { LockerCard } from '../../components/domain/LockerCard';

export default function LocationDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: location, loading, error, reload } = useAsync(() => locationsService.getById(id), [id]);

  const [selectedSize, setSelectedSize] = useState<LockerSize>('MEDIUM');
  const [selectedPeriod, setSelectedPeriod] = useState<RentalPeriod>('DAILY');
  const [selectedLocker, setSelectedLocker] = useState<LockerDto | null>(null);
  const [imgError, setImgError] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (loading) return <Loading />;
  if (error || !location) return <ErrorAlert message={error ?? 'Ponto não encontrado'} onRetry={() => void reload()} />;

  const selectedPlan = location.pricingPlans.find(
    (p) => p.size === selectedSize && p.period === selectedPeriod,
  );
  const availableForSize = location.availableBySize[selectedSize] ?? 0;

  // Filtrar armários do tamanho selecionado
  const lockersOfSize = (location.lockers || []).filter((l) => l.size === selectedSize);

  const handleProceed = () => {
    navigate('/app/checkout', {
      state: {
        locationId: location.id,
        size: selectedSize,
        period: selectedPeriod,
        lockerId: selectedLocker?.id,
        lockerCode: selectedLocker?.code,
      },
    });
  };

  const currentPhoto = location.photoUrls?.[activePhotoIdx];

  return (
    <div className="space-y-4">
      <Link
        to="/app/explore"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para explorar
      </Link>

      {/* Imagem de Capa com Fallback Limpo e Galeria */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
        {currentPhoto && !imgError ? (
          <img
            src={currentPhoto}
            alt={location.name}
            onError={() => setImgError(true)}
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="h-48 w-full flex flex-col items-center justify-center bg-slate-200 text-slate-400">
            <Building2 className="w-12 h-12 stroke-[1.5] mb-1" />
            <span className="text-xs font-semibold text-slate-500">{location.campus}</span>
          </div>
        )}

        {location.photoUrls && location.photoUrls.length > 1 && (
          <div className="absolute bottom-2 right-2 flex gap-1 bg-black/50 p-1 rounded-lg backdrop-blur-xs">
            {location.photoUrls.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setImgError(false);
                  setActivePhotoIdx(idx);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  activePhotoIdx === idx ? 'bg-white scale-110' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dados do Ponto */}
      <div className="card space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-snug">{location.name}</h1>
            <p className="text-xs text-slate-500">Parceiro responsável: {location.partnerName}</p>
          </div>
          <Badge tone={location.availableCount > 0 ? 'green' : 'gray'}>
            {location.availableCount} livres
          </Badge>
        </div>

        <div className="text-xs text-slate-600 space-y-1 pt-1">
          <p className="flex items-center gap-1.5 font-medium">
            <MapPin className="h-4 w-4 text-brand-600 shrink-0" />
            {location.campus} • {location.building}, {location.block}, {location.floor} ({location.roomOrCorridor})
          </p>
          {location.openingHours && (
            <p className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-brand-600 shrink-0" /> Horário: {location.openingHours}
            </p>
          )}
        </div>
      </div>

      {/* Seleção de tamanho e período */}
      <div className="card space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
          1. Escolha o tamanho do compartimento
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {LOCKER_SIZES.map((size) => {
            const count = location.availableBySize[size] ?? 0;
            const active = selectedSize === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setSelectedSize(size);
                  setSelectedLocker(null);
                }}
                className={`rounded-2xl border-2 p-3 text-left transition-all ${
                  active
                    ? 'border-brand-600 bg-brand-50/60 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{lockerSizeLabels[size]}</span>
                  {active && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-tight">{lockerSizeHints[size]}</p>
                <p className={`mt-2 text-[11px] font-bold ${count > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {count > 0 ? `${count} disponíveis` : 'Esgotado'}
                </p>
              </button>
            );
          })}
        </div>

        <h2 className="pt-2 text-xs font-black uppercase tracking-wider text-slate-700">
          2. Escolha o período de aluguel
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {RENTAL_PERIODS.map((period) => {
            const plan = location.pricingPlans.find((p) => p.size === selectedSize && p.period === period);
            const active = selectedPeriod === period;
            return (
              <button
                key={period}
                type="button"
                onClick={() => setSelectedPeriod(period)}
                className={`rounded-2xl border-2 p-3 text-left transition-all ${
                  active
                    ? 'border-brand-600 bg-brand-50/60 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <p className="text-xs font-bold text-slate-800">{periodLabels[period]}</p>
                <p className="mt-1 text-sm font-black text-brand-700">
                  {plan ? formatCents(plan.priceCents) : '—'}
                </p>
              </button>
            );
          })}
        </div>

        {/* Escolha opcional do armário específico se houver lista */}
        {lockersOfSize.length > 0 && (
          <div className="pt-2 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                3. Escolher compartimento específico (opcional)
              </h2>
              {selectedLocker && (
                <button
                  type="button"
                  onClick={() => setSelectedLocker(null)}
                  className="text-[11px] text-brand-600 font-bold hover:underline"
                >
                  Alocação automática
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Selecione uma porta específica ou deixe o sistema escolher a melhor vaga livre para você.
            </p>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
              {lockersOfSize.map((l) => (
                <LockerCard
                  key={l.id}
                  locker={l}
                  selected={selectedLocker?.id === l.id}
                  onSelect={(locker) => setSelectedLocker(locker)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card space-y-1 text-xs text-slate-600 bg-amber-50/40 border-amber-200/80">
        <p className="flex items-center gap-1.5 font-bold text-amber-900">
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" /> Regras de utilização do espaço
        </p>
        <p className="leading-relaxed">{location.usageRules}</p>
      </div>

      <button
        type="button"
        disabled={availableForSize === 0 || !selectedPlan}
        onClick={handleProceed}
        className="btn-primary w-full py-3.5 text-sm font-bold shadow-lg shadow-brand-600/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {availableForSize === 0
          ? 'Sem vagas livres neste tamanho'
          : `Reservar por ${formatCents(selectedPlan?.priceCents)}`}
      </button>
    </div>
  );
}
