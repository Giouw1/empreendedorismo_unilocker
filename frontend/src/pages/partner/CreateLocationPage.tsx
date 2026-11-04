import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { partnerService } from '../../services/partner.service';
import { useAction } from '../../hooks/useAsync';
import { CAMPUS_OPTIONS, LOCKER_SIZES, lockerSizeLabels, periodLabels, RENTAL_PERIODS } from '../../utils/formatters';
import type { LockerInput, LockerSize, PricingPlanInput, RentalPeriod } from '../../types/api';
import { ErrorAlert, PageHeader, Spinner } from '../../components/ui';

export default function CreateLocationPage() {
  const navigate = useNavigate();
  const { pending, error, run } = useAction();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Etapa 1 — Localização
  const [name, setName] = useState('Espaço Estudantil — Bloco H');
  const [campus, setCampus] = useState(CAMPUS_OPTIONS[0]);
  const [building, setBuilding] = useState('Centro de Tecnologia (CT)');
  const [block, setBlock] = useState('Bloco H');
  const [floor, setFloor] = useState('2º andar');
  const [roomOrCorridor, setRoomOrCorridor] = useState('Corredor da biblioteca');
  const [reference, setReference] = useState('Ao lado dos bebedouros');
  const [openingHours, setOpeningHours] = useState('Seg a Sex, 08:00 às 21:00');
  const [accessInstructions, setAccessInstructions] = useState(
    'Suba a escada principal do Bloco H até o 2º andar e vire à direita.',
  );
  const [usageRules, setUsageRules] = useState(
    'Proibido armazenar alimentos perecíveis. Retire os pertences até o fechamento.',
  );

  // Etapa 2 — Equipamentos
  const [lockersData, setLockersData] = useState<LockerInput[]>([
    { code: 'H-01', size: 'SMALL' },
    { code: 'H-02', size: 'MEDIUM' },
    { code: 'H-03', size: 'MEDIUM' },
    { code: 'H-04', size: 'LARGE' },
  ]);
  const [newCode, setNewCode] = useState('H-05');
  const [newSize, setNewSize] = useState<LockerSize>('MEDIUM');

  // Etapa 3 — Preços (em Reais na UI -> centavos no envio)
  const [pricesBrl, setPricesBrl] = useState<Record<LockerSize, Record<RentalPeriod, string>>>({
    SMALL: { DAILY: '5', WEEKLY: '25', MONTHLY: '80' },
    MEDIUM: { DAILY: '8', WEEKLY: '40', MONTHLY: '120' },
    LARGE: { DAILY: '12', WEEKLY: '60', MONTHLY: '180' },
  });

  // TODO [PLANO-FRONTEND]: persistir rascunho em localStorage (useLocalStorageDraft).

  const addLockerRow = () => {
    if (!newCode.trim()) return;
    setLockersData((prev) => [...prev, { code: newCode.trim().toUpperCase(), size: newSize }]);
    setNewCode('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const pricingPlans: PricingPlanInput[] = [];
    LOCKER_SIZES.forEach((size) => {
      RENTAL_PERIODS.forEach((period) => {
        const val = Number(pricesBrl[size][period]);
        if (val > 0) {
          pricingPlans.push({ size, period, priceCents: Math.round(val * 100) });
        }
      });
    });

    const created = await run(() =>
      partnerService.createLocation({
        locationData: {
          name,
          campus,
          building,
          block,
          floor,
          roomOrCorridor,
          reference,
          latitude: -22.8605,
          longitude: -43.2285,
          openingHours,
          accessInstructions,
          usageRules,
          photoUrls: ['https://images.unsplash.com/photo-1562774053-701939374585?w=800'],
        },
        lockersData,
        pricingPlans,
      }),
    );
    if (created) {
      navigate('/partner/dashboard');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Criar ponto de lockers"
        subtitle={`Etapa ${step} de 4 — Será enviado para aprovação administrativa`}
      />

      <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-semibold">
        {[
          [1, '1. Local'],
          [2, '2. Lockers'],
          [3, '3. Preços'],
          [4, '4. Revisão'],
        ].map(([num, label]) => (
          <button
            key={num}
            type="button"
            onClick={() => setStep(num as 1 | 2 | 3 | 4)}
            className={`rounded-lg py-2 ${
              step === num ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ErrorAlert message={error} />

      <form onSubmit={(e) => void handleSubmit(e)} className="card space-y-4">
        {step === 1 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Nome do ponto</label>
              <input required className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Campus</label>
              <select className="input" value={campus} onChange={(e) => setCampus(e.target.value)}>
                {CAMPUS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Prédio</label>
              <input required className="input" value={building} onChange={(e) => setBuilding(e.target.value)} />
            </div>
            <div>
              <label className="label">Bloco</label>
              <input className="input" value={block} onChange={(e) => setBlock(e.target.value)} />
            </div>
            <div>
              <label className="label">Andar</label>
              <input className="input" value={floor} onChange={(e) => setFloor(e.target.value)} />
            </div>
            <div>
              <label className="label">Sala / Corredor</label>
              <input className="input" value={roomOrCorridor} onChange={(e) => setRoomOrCorridor(e.target.value)} />
            </div>
            <div>
              <label className="label">Referência visual</label>
              <input className="input" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Instruções de acesso</label>
              <textarea rows={2} className="input" value={accessInstructions} onChange={(e) => setAccessInstructions(e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Código (ex.: H-05)"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
              />
              <select className="input" value={newSize} onChange={(e) => setNewSize(e.target.value as LockerSize)}>
                {LOCKER_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {lockerSizeLabels[s]}
                  </option>
                ))}
              </select>
              <button type="button" onClick={addLockerRow} className="btn-secondary whitespace-nowrap text-xs">
                + Adicionar
              </button>
            </div>
            <ul className="divide-y divide-slate-100 text-xs">
              {lockersData.map((lk, idx) => (
                <li key={`${lk.code}-${idx}`} className="flex items-center justify-between py-2">
                  <span>
                    <strong>{lk.code}</strong> — {lockerSizeLabels[lk.size]}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLockersData((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-red-600 hover:underline"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div>
              <label className="label">Horário de funcionamento</label>
              <input className="input" value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} />
            </div>
            <div>
              <label className="label">Regras de utilização</label>
              <textarea rows={2} className="input" value={usageRules} onChange={(e) => setUsageRules(e.target.value)} />
            </div>
            <p className="text-xs font-bold text-slate-700 uppercase">Tabela de preços (em R$)</p>
            {LOCKER_SIZES.map((size) => (
              <div key={size} className="grid grid-cols-4 items-center gap-2 text-xs">
                <strong>{lockerSizeLabels[size]}</strong>
                {RENTAL_PERIODS.map((period) => (
                  <div key={period}>
                    <label className="text-[10px] text-slate-500">{periodLabels[period]}</label>
                    <input
                      type="number"
                      min="1"
                      className="input"
                      value={pricesBrl[size][period]}
                      onChange={(e) =>
                        setPricesBrl((prev) => ({
                          ...prev,
                          [size]: { ...prev[size], [period]: e.target.value },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-2 text-xs text-slate-700">
            <p>
              <strong>Ponto:</strong> {name} ({campus} — {building}, {block}, {floor})
            </p>
            <p>
              <strong>Horários:</strong> {openingHours}
            </p>
            <p>
              <strong>Compartimentos configurados:</strong> {lockersData.length} unidades
            </p>
            <p className="rounded-xl bg-amber-50 p-3 text-amber-800">
              Após o envio, o ponto ficará com status <strong>Aguardando aprovação</strong> até a revisão da administração.
            </p>
          </div>
        )}

        <div className="flex justify-between border-t border-slate-100 pt-3">
          {step > 1 ? (
            <button type="button" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)} className="btn-secondary text-xs">
              Voltar
            </button>
          ) : (
            <span />
          )}
          {step < 4 ? (
            <button type="button" onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)} className="btn-primary text-xs">
              Próxima etapa
            </button>
          ) : (
            <button type="submit" disabled={pending || lockersData.length === 0} className="btn-primary text-xs">
              {pending && <Spinner />} Enviar ponto para aprovação
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
