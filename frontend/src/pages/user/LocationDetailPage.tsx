import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle2, Clock, Handshake, Mail, MapPin, MessageCircle, Phone, ShieldAlert } from 'lucide-react';
import { locationsService } from '../../services/locations.service';
import { useAsync } from '../../hooks/useAsync';
import { formatCents, LOCKER_SIZES, lockerSizeHints, lockerSizeLabels, periodLabels, RENTAL_PERIODS } from '../../utils/formatters';
import type { LockerDto, LockerSize, RentalPeriod } from '../../types/api';
import { Badge, ErrorAlert, Loading } from '../../components/ui';
import { LockerCard } from '../../components/domain/LockerCard';

const perDayDivisor: Record<RentalPeriod, number> = { DAILY: 1, WEEKLY: 7, MONTHLY: 30 };

function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return `https://wa.me/${digits.startsWith('55') ? digits : `55${digits}`}`;
}

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

  const selectedPlan = location.pricingPlans.find((p) => p.size === selectedSize && p.period === selectedPeriod);
  const availableForSize = location.availableBySize[selectedSize] ?? 0;
  const lockersOfSize = (location.lockers || []).filter((l) => l.size === selectedSize);
  const currentPhoto = location.photoUrls?.[activePhotoIdx];
  const wa = location.partnerContactPhone ? whatsappLink(location.partnerContactPhone) : null;

  const handleProceed = () => {
    navigate('/app/checkout', {
      state: { locationId: location.id, size: selectedSize, period: selectedPeriod, lockerId: selectedLocker?.id, lockerCode: selectedLocker?.code },
    });
  };

  const optionClass = (active: boolean) =>
    `min-w-0 rounded-box border-2 p-3 text-left transition-all ${active ? 'border-primary bg-primary/5 shadow-xs' : 'border-base-300 bg-base-100 hover:border-base-content/20'}`;

  return (
    <div className="space-y-4">
      <Link to="/app/explore" className="inline-flex items-center gap-1.5 text-sm font-medium text-base-content/70 hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Voltar para explorar
      </Link>

      <div className="grid gap-4 md:grid-cols-5 md:items-start md:gap-6">
        {/* Coluna de informações */}
        <div className="space-y-4 md:col-span-3">
          <div className="relative overflow-hidden rounded-box border border-base-300 bg-base-200">
            {currentPhoto && !imgError ? (
              <img src={currentPhoto} alt={location.name} onError={() => setImgError(true)} className="aspect-[16/9] w-full object-cover" />
            ) : (
              <div className="flex aspect-[16/9] w-full flex-col items-center justify-center text-base-content/40">
                <Building2 className="mb-1 h-12 w-12" strokeWidth={1.5} />
                <span className="text-xs font-medium">{location.campus}</span>
              </div>
            )}
            {location.photoUrls.length > 1 && (
              <div className="absolute right-2 bottom-2 flex gap-1 rounded-field bg-black/50 p-1">
                {location.photoUrls.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Foto ${idx + 1}`}
                    onClick={() => {
                      setImgError(false);
                      setActivePhotoIdx(idx);
                    }}
                    className={`h-2.5 w-2.5 rounded-full ${activePhotoIdx === idx ? 'bg-white' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            )}
          </div>

          <section className="panel space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h1 className="min-w-0 text-lg leading-snug font-semibold md:text-xl">{location.name}</h1>
              <Badge tone={location.availableCount > 0 ? 'green' : 'gray'}>{location.availableCount} livres</Badge>
            </div>
            <ul className="space-y-1.5 text-sm text-base-content/70">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0">
                  {location.campus} · {location.building}, {location.block}, {location.floor}
                  <span className="block text-xs text-base-content/50">{location.roomOrCorridor}</span>
                </span>
              </li>
              {location.openingHours && (
                <li className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0">{location.openingHours}</span>
                </li>
              )}
            </ul>
          </section>

          {/* Parceiro responsável por este ponto */}
          <section className="panel space-y-3" aria-labelledby="partner-title">
            <div className="flex items-start gap-3">
              <span className="icon-chip">
                <Handshake className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p id="partner-title" className="text-xs font-medium text-base-content/60">
                  Parceiro responsável
                </p>
                <p className="font-semibold">{location.partnerName}</p>
              </div>
            </div>
            {(location.partnerContactPhone || location.partnerContactEmail) && (
              <div className="flex flex-wrap gap-2">
                {wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-success btn-soft">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                )}
                {location.partnerContactPhone && (
                  <a href={`tel:${location.partnerContactPhone.replace(/[^\d+]/g, '')}`} className="btn btn-sm">
                    <Phone className="h-4 w-4" /> {location.partnerContactPhone}
                  </a>
                )}
                {location.partnerContactEmail && (
                  <a href={`mailto:${location.partnerContactEmail}`} className="btn btn-sm max-w-full">
                    <Mail className="h-4 w-4 shrink-0" /> <span className="truncate">{location.partnerContactEmail}</span>
                  </a>
                )}
              </div>
            )}
          </section>

          <section className="hidden space-y-1.5 rounded-box border border-warning/30 bg-warning/5 p-4 text-sm md:block">
            <p className="flex items-center gap-2 font-semibold">
              <ShieldAlert className="h-4 w-4 shrink-0 text-warning" /> Regras do espaço
            </p>
            <p className="text-base-content/70">{location.usageRules}</p>
          </section>
        </div>

        {/* Coluna de reserva */}
        <div className="space-y-4 md:sticky md:top-20 md:col-span-2">
          <section className="panel space-y-4">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">1. Tamanho do compartimento</h2>
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
                      className={optionClass(active)}
                    >
                      <span className="flex items-center justify-between gap-1">
                        <span className="truncate text-sm font-semibold">{lockerSizeLabels[size]}</span>
                        {active && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-[11px] leading-tight text-base-content/60">{lockerSizeHints[size]}</span>
                      <span className={`mt-2 block text-[11px] font-semibold ${count > 0 ? 'text-success' : 'text-error'}`}>
                        {count > 0 ? `${count} livres` : 'Esgotado'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-semibold">2. Período</h2>
              <div className="grid grid-cols-3 gap-2">
                {RENTAL_PERIODS.map((period) => {
                  const plan = location.pricingPlans.find((p) => p.size === selectedSize && p.period === period);
                  const active = selectedPeriod === period;
                  return (
                    <button key={period} type="button" onClick={() => setSelectedPeriod(period)} className={optionClass(active)}>
                      <span className="block truncate text-xs font-medium text-base-content/70">{periodLabels[period].split(' ')[0]}</span>
                      <span className="mt-0.5 block truncate text-sm font-semibold text-primary tabular-nums">{plan ? formatCents(plan.priceCents) : '—'}</span>
                      {plan && period !== 'DAILY' && (
                        <span className="block truncate text-[11px] text-base-content/50 tabular-nums">
                          {formatCents(Math.round(plan.priceCents / perDayDivisor[period]))}/dia
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {lockersOfSize.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">3. Compartimento (opcional)</h2>
                  {selectedLocker && (
                    <button type="button" onClick={() => setSelectedLocker(null)} className="link link-primary text-xs">
                      Escolher automático
                    </button>
                  )}
                </div>
                <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto p-0.5">
                  {lockersOfSize.map((l) => (
                    <LockerCard key={l.id} locker={l} selected={selectedLocker?.id === l.id} onSelect={(locker) => setSelectedLocker(locker)} />
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={availableForSize === 0 || !selectedPlan}
              onClick={handleProceed}
              className="btn btn-primary btn-block"
            >
              {availableForSize === 0 ? 'Sem vagas neste tamanho' : `Pré-reservar por ${formatCents(selectedPlan?.priceCents)}`}
            </button>
            <p className="text-center text-xs text-base-content/50">Você confirma e paga no local, com o parceiro.</p>
          </section>

          <section className="space-y-1.5 rounded-box border border-warning/30 bg-warning/5 p-4 text-sm md:hidden">
            <p className="flex items-center gap-2 font-semibold">
              <ShieldAlert className="h-4 w-4 shrink-0 text-warning" /> Regras do espaço
            </p>
            <p className="text-base-content/70">{location.usageRules}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
