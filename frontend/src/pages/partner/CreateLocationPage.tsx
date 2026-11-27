import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, Building2, Check, Handshake, Plus, RotateCcw, ShieldCheck, Tag, Trash2 } from 'lucide-react';
import { partnerService } from '../../services/partner.service';
import { useAction } from '../../hooks/useAsync';
import { useLocalStorageDraft } from '../../hooks/useLocalStorageDraft';
import { CAMPUS_OPTIONS, formatCents, LOCKER_SIZES, lockerSizeLabels, periodLabels, RENTAL_PERIODS } from '../../utils/formatters';
import { isValidEmail, validateLocationStep1, validateLocationStep2 } from '../../utils/validators';
import { MIN_PRICE_CENTS, type LockerInput, type LockerSize, type PricingPlanInput, type RentalPeriod } from '../../types/api';
import { ErrorAlert, PageHeader, Spinner } from '../../components/ui';

interface LocationDraftState {
  name: string;
  campus: string;
  building: string;
  block: string;
  floor: string;
  roomOrCorridor: string;
  reference: string;
  openingHours: string;
  accessInstructions: string;
  usageRules: string;
  coverPhotoUrl: string;
  hostName: string;
  contactPhone: string;
  contactEmail: string;
  lockersData: LockerInput[];
  pricesBrl: Record<LockerSize, Record<RentalPeriod, string>>;
}

const defaultDraft: LocationDraftState = {
  name: 'Espaço Estudantil — Bloco H',
  campus: CAMPUS_OPTIONS[0],
  building: 'Centro de Tecnologia (CT)',
  block: 'Bloco H',
  floor: '2º andar',
  roomOrCorridor: 'Corredor da biblioteca',
  reference: 'Ao lado dos bebedouros',
  openingHours: 'Seg a Sex, 08:00 às 21:00',
  accessInstructions: 'Suba a escada principal do Bloco H até o 2º andar e vire à direita.',
  usageRules: 'Proibido armazenar alimentos perecíveis. Retire os pertences até o horário de fechamento.',
  coverPhotoUrl: '/locations/ct-fachada.jpg',
  hostName: '',
  contactPhone: '',
  contactEmail: '',
  lockersData: [
    { code: 'H-01', size: 'SMALL' },
    { code: 'H-02', size: 'MEDIUM' },
    { code: 'H-03', size: 'MEDIUM' },
    { code: 'H-04', size: 'LARGE' },
  ],
  pricesBrl: {
    SMALL: { DAILY: '5', WEEKLY: '25', MONTHLY: '100' },
    MEDIUM: { DAILY: '8', WEEKLY: '40', MONTHLY: '140' },
    LARGE: { DAILY: '12', WEEKLY: '60', MONTHLY: '200' },
  },
};

const PERIOD_DAYS: Record<RentalPeriod, number> = { DAILY: 1, WEEKLY: 7, MONTHLY: 30 };

function parseBrl(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

/** Erros (bloqueiam) e avisos (não bloqueiam) da tabela de preços. */
function checkPrices(sizes: LockerSize[], prices: LocationDraftState['pricesBrl']) {
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const size of sizes) {
    const cents = RENTAL_PERIODS.map((p) => parseBrl(prices[size][p]));
    RENTAL_PERIODS.forEach((period, i) => {
      const c = cents[i];
      if (c === null) errors.push(`Informe o preço ${periodLabels[period].toLowerCase()} do tamanho ${lockerSizeLabels[size].toLowerCase()}.`);
      else if (c < MIN_PRICE_CENTS[period])
        errors.push(`${lockerSizeLabels[size]} · ${periodLabels[period]}: o mínimo é ${formatCents(MIN_PRICE_CENTS[period])}.`);
    });
    const perDay = RENTAL_PERIODS.map((p, i) => (cents[i] ?? 0) / PERIOD_DAYS[p]);
    if (cents.every((c) => c !== null)) {
      if (perDay[1] > perDay[0]) warnings.push(`${lockerSizeLabels[size]}: o semanal sai mais caro por dia que o diário.`);
      if (perDay[2] > perDay[1]) warnings.push(`${lockerSizeLabels[size]}: o mensal sai mais caro por dia que o semanal.`);
    }
  }
  return { errors, warnings };
}

function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-base-content/50">{hint}</span>}
    </label>
  );
}

export default function CreateLocationPage() {
  const navigate = useNavigate();
  const { pending, error, run } = useAction();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [draft, setDraft, clearDraft] = useLocalStorageDraft<LocationDraftState>('unilocker_partner_location_wizard_draft_v2', defaultDraft);
  const [newCode, setNewCode] = useState('H-05');
  const [newSize, setNewSize] = useState<LockerSize>('MEDIUM');

  const update = <K extends keyof LocationDraftState>(key: K, value: LocationDraftState[K]) => setDraft((p) => ({ ...p, [key]: value }));
  const usedSizes = useMemo(() => LOCKER_SIZES.filter((s) => draft.lockersData.some((l) => l.size === s)), [draft.lockersData]);
  const priceCheck = useMemo(() => checkPrices(usedSizes, draft.pricesBrl), [usedSizes, draft.pricesBrl]);

  const handleAddLocker = () => {
    const code = newCode.trim().toUpperCase();
    if (!code) return;
    if (draft.lockersData.some((l) => l.code === code)) {
      setStepError(`Já existe um compartimento com o código ${code}.`);
      return;
    }
    setDraft((p) => ({ ...p, lockersData: [...p.lockersData, { code, size: newSize }] }));
    setNewCode('');
    setStepError(null);
  };

  const goToNextStep = () => {
    setStepError(null);
    if (step === 1) {
      const v = validateLocationStep1(draft);
      if (!v.valid) return setStepError(Object.values(v.errors)[0]);
      if (draft.contactEmail.trim() && !isValidEmail(draft.contactEmail)) return setStepError('Informe um e-mail de contato válido.');
      setStep(2);
    } else if (step === 2) {
      const v = validateLocationStep2(draft.lockersData);
      if (!v.valid) return setStepError(v.error || 'Configure ao menos um compartimento válido.');
      setStep(3);
    } else if (step === 3) {
      if (priceCheck.errors.length) return setStepError(priceCheck.errors[0]);
      setStep(4);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (priceCheck.errors.length) {
      setStep(3);
      setStepError(priceCheck.errors[0]);
      return;
    }
    const pricingPlans: PricingPlanInput[] = usedSizes.flatMap((size) =>
      RENTAL_PERIODS.map((period) => ({ size, period, priceCents: parseBrl(draft.pricesBrl[size][period]) ?? 0 })),
    );
    const created = await run(() =>
      partnerService.createLocation({
        locationData: {
          name: draft.name,
          campus: draft.campus,
          building: draft.building,
          block: draft.block,
          floor: draft.floor,
          roomOrCorridor: draft.roomOrCorridor,
          reference: draft.reference,
          latitude: -22.8605,
          longitude: -43.2285,
          openingHours: draft.openingHours,
          accessInstructions: draft.accessInstructions,
          usageRules: draft.usageRules,
          photoUrls: draft.coverPhotoUrl ? [draft.coverPhotoUrl] : [],
          hostName: draft.hostName.trim(),
          contactPhone: draft.contactPhone.trim(),
          contactEmail: draft.contactEmail.trim(),
        },
        lockersData: draft.lockersData,
        pricingPlans,
      }),
    );
    if (created) {
      clearDraft();
      navigate('/partner/dashboard');
    }
  };

  const steps = ['Local', 'Lockers', 'Preços', 'Revisão'];
  const nav = (back: (() => void) | null, nextLabel: string) => (
    <div className="flex gap-2 pt-2">
      {back && (
        <button type="button" onClick={back} className="btn flex-1">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
      )}
      <button type="button" onClick={goToNextStep} className="btn btn-primary flex-1">
        {nextLabel} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link to="/partner/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-base-content/70 hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Cancelar
        </Link>
        <button type="button" onClick={clearDraft} className="btn btn-ghost btn-xs text-base-content/60" title="Restaurar formulário padrão">
          <RotateCcw className="h-3.5 w-3.5" /> Limpar rascunho
        </button>
      </div>

      <PageHeader title="Novo ponto de lockers" subtitle="Quatro passos rápidos. Depois, a equipe UniLocker aprova a publicação." />

      <ul className="steps steps-horizontal w-full text-xs">
        {steps.map((title, i) => (
          <li key={title} className={`step ${step >= i + 1 ? 'step-primary' : ''}`}>
            {title}
          </li>
        ))}
      </ul>

      <ErrorAlert message={stepError} />
      <ErrorAlert message={error} />

      {step === 1 && (
        <div className="space-y-4">
          <section className="panel space-y-3">
            <h2 className="section-title border-b border-base-300 pb-2">
              <Building2 className="h-4 w-4 text-primary" /> Onde fica
            </h2>
            <Field label="Nome do ponto">
              <input className="input w-full" value={draft.name} onChange={(e) => update('name', e.target.value)} placeholder="Ex.: Espaço Maker Poli — Bloco F" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Campus">
                <select className="select w-full" value={draft.campus} onChange={(e) => update('campus', e.target.value)}>
                  {CAMPUS_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Prédio">
                <input className="input w-full" value={draft.building} onChange={(e) => update('building', e.target.value)} placeholder="Ex.: Centro de Tecnologia" />
              </Field>
              <Field label="Bloco">
                <input className="input w-full" value={draft.block} onChange={(e) => update('block', e.target.value)} placeholder="Ex.: Bloco H" />
              </Field>
              <Field label="Andar">
                <input className="input w-full" value={draft.floor} onChange={(e) => update('floor', e.target.value)} placeholder="Ex.: 2º andar" />
              </Field>
              <Field label="Sala ou corredor">
                <input className="input w-full" value={draft.roomOrCorridor} onChange={(e) => update('roomOrCorridor', e.target.value)} placeholder="Ex.: Hall da biblioteca" />
              </Field>
              <Field label="Ponto de referência">
                <input className="input w-full" value={draft.reference} onChange={(e) => update('reference', e.target.value)} placeholder="Ex.: Ao lado dos bebedouros" />
              </Field>
            </div>
            <Field label="Horário de funcionamento">
              <input className="input w-full" value={draft.openingHours} onChange={(e) => update('openingHours', e.target.value)} placeholder="Ex.: Seg a Sex, 08:00 às 21:00" />
            </Field>
            <Field label="Como chegar até os lockers">
              <textarea className="textarea min-h-20 w-full" value={draft.accessInstructions} onChange={(e) => update('accessInstructions', e.target.value)} />
            </Field>
            <Field label="Foto do local (URL)" hint="Use uma foto real da fachada ou do espaço.">
              <input className="input w-full" value={draft.coverPhotoUrl} onChange={(e) => update('coverPhotoUrl', e.target.value)} placeholder="https://…" />
            </Field>
          </section>

          <section className="panel space-y-3">
            <h2 className="section-title border-b border-base-300 pb-2">
              <Handshake className="h-4 w-4 text-primary" /> Parceiro deste ponto
            </h2>
            <p className="text-xs text-base-content/60">É o nome e o contato que os alunos veem na página do ponto. Se ficar em branco, usamos os dados da sua organização.</p>
            <Field label="Nome do parceiro">
              <input className="input w-full" value={draft.hostName} onChange={(e) => update('hostName', e.target.value)} placeholder="Ex.: Centro Acadêmico de Engenharia (CAEng)" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Telefone / WhatsApp">
                <input className="input w-full" inputMode="tel" value={draft.contactPhone} onChange={(e) => update('contactPhone', e.target.value)} placeholder="(21) 99999-0000" />
              </Field>
              <Field label="E-mail">
                <input className="input w-full" type="email" value={draft.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} placeholder="contato@ufrj.br" />
              </Field>
            </div>
          </section>
          {nav(null, 'Próximo: lockers')}
        </div>
      )}

      {step === 2 && (
        <section className="panel space-y-4">
          <h2 className="section-title border-b border-base-300 pb-2">Compartimentos</h2>
          <div className="flex flex-wrap items-end gap-2 rounded-box bg-base-200/60 p-3">
            <Field label="Código" className="min-w-28 flex-1">
              <input className="input w-full uppercase" value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="Ex.: H-05" />
            </Field>
            <Field label="Tamanho" className="w-36">
              <select className="select w-full" value={newSize} onChange={(e) => setNewSize(e.target.value as LockerSize)}>
                {LOCKER_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {lockerSizeLabels[s]}
                  </option>
                ))}
              </select>
            </Field>
            <button type="button" onClick={handleAddLocker} className="btn btn-primary">
              <Plus className="h-4 w-4" /> Adicionar
            </button>
          </div>

          <p className="text-sm text-base-content/60">{draft.lockersData.length} compartimentos</p>
          <ul className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
            {draft.lockersData.map((locker, idx) => (
              <li key={locker.code} className="flex items-center justify-between gap-2 rounded-field border border-base-300 bg-base-100 p-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-field bg-base-200 px-1.5 text-xs font-bold">{locker.code}</span>
                  <span className="truncate text-sm">{lockerSizeLabels[locker.size]}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDraft((p) => ({ ...p, lockersData: p.lockersData.filter((_, i) => i !== idx) }))}
                  className="btn btn-ghost btn-sm btn-square text-base-content/50 hover:text-error"
                  aria-label={`Remover ${locker.code}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          {nav(() => setStep(1), 'Próximo: preços')}
        </section>
      )}

      {step === 3 && (
        <section className="panel space-y-4">
          <h2 className="section-title border-b border-base-300 pb-2">
            <Tag className="h-4 w-4 text-primary" /> Preços
          </h2>
          <div className="rounded-box bg-base-200/60 p-3 text-xs text-base-content/70">
            Mínimos: diário {formatCents(MIN_PRICE_CENTS.DAILY)}, semanal {formatCents(MIN_PRICE_CENTS.WEEKLY)} e mensal {formatCents(MIN_PRICE_CENTS.MONTHLY)}.
            Planos mais longos devem sair mais baratos por dia, para incentivar aluguéis longos.
          </div>
          <div className="space-y-3">
            {usedSizes.map((size) => (
              <div key={size} className="space-y-2 rounded-box border border-base-300 p-3">
                <p className="text-sm font-semibold">Tamanho {lockerSizeLabels[size].toLowerCase()}</p>
                <div className="grid grid-cols-3 gap-2">
                  {RENTAL_PERIODS.map((period) => {
                    const cents = parseBrl(draft.pricesBrl[size][period]);
                    const tooLow = cents !== null && cents < MIN_PRICE_CENTS[period];
                    return (
                      <label key={period} className="block min-w-0">
                        <span className="mb-1 block truncate text-xs text-base-content/60">{periodLabels[period].split(' ')[0]} (R$)</span>
                        <input
                          type="number"
                          min={MIN_PRICE_CENTS[period] / 100}
                          step="0.5"
                          inputMode="decimal"
                          className={`input w-full ${tooLow ? 'input-error' : ''}`}
                          value={draft.pricesBrl[size][period]}
                          onChange={(e) => setDraft((p) => ({ ...p, pricesBrl: { ...p.pricesBrl, [size]: { ...p.pricesBrl[size], [period]: e.target.value } } }))}
                        />
                        <span className={`mt-1 block truncate text-[11px] ${tooLow ? 'text-error' : 'text-base-content/50'}`}>
                          {tooLow ? `mín. ${formatCents(MIN_PRICE_CENTS[period])}` : cents ? `${formatCents(Math.round(cents / PERIOD_DAYS[period]))}/dia` : '—'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {priceCheck.warnings.length > 0 && (
            <div role="status" className="alert alert-warning alert-soft items-start text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <ul className="min-w-0 space-y-0.5">
                {priceCheck.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          <Field label="Regras de uso do espaço">
            <textarea className="textarea min-h-20 w-full" value={draft.usageRules} onChange={(e) => update('usageRules', e.target.value)} />
          </Field>
          {nav(() => setStep(2), 'Revisar')}
        </section>
      )}

      {step === 4 && (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <section className="panel space-y-3">
            <h2 className="section-title border-b border-base-300 pb-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Revisão
            </h2>
            <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="text-base-content/60">Nome</dt>
              <dd className="font-medium">{draft.name}</dd>
              <dt className="text-base-content/60">Local</dt>
              <dd>
                {draft.campus} — {draft.building}, {draft.block} ({draft.floor})
              </dd>
              <dt className="text-base-content/60">Horário</dt>
              <dd>{draft.openingHours}</dd>
              <dt className="text-base-content/60">Parceiro</dt>
              <dd>{draft.hostName || 'Sua organização'}{draft.contactPhone && ` · ${draft.contactPhone}`}</dd>
              <dt className="text-base-content/60">Compartimentos</dt>
              <dd>{draft.lockersData.length}</dd>
            </dl>
            <p className="rounded-field bg-base-200/60 p-3 text-xs text-base-content/60">
              Você recebe 90% de cada aluguel. A taxa de tecnologia da UniLocker é de 10%.
            </p>
          </section>
          <div className="flex gap-2">
            <button type="button" disabled={pending} onClick={() => setStep(3)} className="btn flex-1">
              <ArrowLeft className="h-4 w-4" /> Ajustar preços
            </button>
            <button type="submit" disabled={pending} className="btn btn-primary flex-1">
              {pending ? <Spinner /> : <Check className="h-4 w-4" />} Enviar para aprovação
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
