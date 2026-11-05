import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { partnerService } from '../../services/partner.service';
import { useAction } from '../../hooks/useAsync';
import { useLocalStorageDraft } from '../../hooks/useLocalStorageDraft';
import {
  CAMPUS_OPTIONS,
  LOCKER_SIZES,
  lockerSizeLabels,
  periodLabels,
  RENTAL_PERIODS,
} from '../../utils/formatters';
import {
  validateLocationStep1,
  validateLocationStep2,
} from '../../utils/validators';
import type { LockerInput, LockerSize, PricingPlanInput, RentalPeriod } from '../../types/api';
import { ErrorAlert, PageHeader, Spinner } from '../../components/ui';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Trash2,
  Building2,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

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
  coverPhotoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800',
  lockersData: [
    { code: 'H-01', size: 'SMALL' },
    { code: 'H-02', size: 'MEDIUM' },
    { code: 'H-03', size: 'MEDIUM' },
    { code: 'H-04', size: 'LARGE' },
  ],
  pricesBrl: {
    SMALL: { DAILY: '5', WEEKLY: '25', MONTHLY: '80' },
    MEDIUM: { DAILY: '8', WEEKLY: '40', MONTHLY: '120' },
    LARGE: { DAILY: '12', WEEKLY: '60', MONTHLY: '180' },
  },
};

export default function CreateLocationPage() {
  const navigate = useNavigate();
  const { pending, error, run } = useAction();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [stepError, setStepError] = useState<string | null>(null);

  const [draft, setDraft, clearDraft] = useLocalStorageDraft<LocationDraftState>(
    'unilocker_partner_location_wizard_draft',
    defaultDraft,
  );

  const [newCode, setNewCode] = useState('H-05');
  const [newSize, setNewSize] = useState<LockerSize>('MEDIUM');

  // Adicionar armário à lista
  const handleAddLocker = () => {
    if (!newCode.trim()) return;
    const codeUpper = newCode.trim().toUpperCase();
    if (draft.lockersData.some((l) => l.code === codeUpper)) {
      setStepError(`Já existe um compartimento com o código ${codeUpper}.`);
      return;
    }
    setDraft((prev) => ({
      ...prev,
      lockersData: [...prev.lockersData, { code: codeUpper, size: newSize }],
    }));
    setNewCode('');
    setStepError(null);
  };

  const handleRemoveLocker = (idx: number) => {
    setDraft((prev) => ({
      ...prev,
      lockersData: prev.lockersData.filter((_, i) => i !== idx),
    }));
  };

  // Navegação entre etapas com validação
  const goToNextStep = () => {
    setStepError(null);
    if (step === 1) {
      const v = validateLocationStep1(draft);
      if (!v.valid) {
        setStepError(Object.values(v.errors)[0]);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const v = validateLocationStep2(draft.lockersData);
      if (!v.valid) {
        setStepError(v.error || 'Configure ao menos um compartimento válido.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStepError(null);

    const pricingPlans: PricingPlanInput[] = [];
    LOCKER_SIZES.forEach((size) => {
      RENTAL_PERIODS.forEach((period) => {
        const val = Number(draft.pricesBrl[size][period]);
        if (val > 0) {
          pricingPlans.push({ size, period, priceCents: Math.round(val * 100) });
        }
      });
    });

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

  const stepsHeader = [
    { num: 1, title: 'Localização' },
    { num: 2, title: 'Armários' },
    { num: 3, title: 'Preços' },
    { num: 4, title: 'Prévia' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          to="/partner/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Cancelar
        </Link>
        <button
          type="button"
          onClick={clearDraft}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600"
          title="Restaurar formulário padrão"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Limpar rascunho
        </button>
      </div>

      <PageHeader
        title="Novo Ponto de Lockers"
        subtitle="Siga o assistente de 4 etapas para cadastrar e submeter seu espaço"
      />

      {/* Barra de Progresso do Wizard */}
      <div className="grid grid-cols-4 gap-2">
        {stepsHeader.map((s) => {
          const isDone = step > s.num;
          const isCurrent = step === s.num;
          return (
            <div
              key={s.num}
              className={`p-2 rounded-xl text-center border-2 transition-all ${
                isCurrent
                  ? 'border-brand-600 bg-brand-50/60 font-black text-brand-700 shadow-xs'
                  : isDone
                  ? 'border-emerald-500 bg-emerald-50/40 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-xs">
                {isDone ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                ) : (
                  <span>{s.num}.</span>
                )}
                <span>{s.title}</span>
              </div>
            </div>
          );
        })}
      </div>

      {stepError && <ErrorAlert message={stepError} />}
      <ErrorAlert message={error} />

      {/* ETAPA 1 — LOCALIZAÇÃO */}
      {step === 1 && (
        <div className="card space-y-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-brand-600" /> Informações do Espaço Físico
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Nome do Ponto</label>
            <input
              className="input text-xs"
              value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ex: Espaço Maker Poli — Bloco F"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Campus</label>
              <select
                className="input text-xs"
                value={draft.campus}
                onChange={(e) => setDraft((p) => ({ ...p, campus: e.target.value }))}
              >
                {CAMPUS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Edifício / Prédio</label>
              <input
                className="input text-xs"
                value={draft.building}
                onChange={(e) => setDraft((p) => ({ ...p, building: e.target.value }))}
                placeholder="Ex: Centro de Tecnologia"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Bloco</label>
              <input
                className="input text-xs"
                value={draft.block}
                onChange={(e) => setDraft((p) => ({ ...p, block: e.target.value }))}
                placeholder="Ex: Bloco H"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Andar</label>
              <input
                className="input text-xs"
                value={draft.floor}
                onChange={(e) => setDraft((p) => ({ ...p, floor: e.target.value }))}
                placeholder="Ex: 2º andar"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Sala ou Corredor</label>
              <input
                className="input text-xs"
                value={draft.roomOrCorridor}
                onChange={(e) => setDraft((p) => ({ ...p, roomOrCorridor: e.target.value }))}
                placeholder="Ex: Hall da biblioteca"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Ponto de Referência</label>
              <input
                className="input text-xs"
                value={draft.reference}
                onChange={(e) => setDraft((p) => ({ ...p, reference: e.target.value }))}
                placeholder="Ex: Ao lado dos bebedouros"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Horário de Funcionamento</label>
            <input
              className="input text-xs"
              value={draft.openingHours}
              onChange={(e) => setDraft((p) => ({ ...p, openingHours: e.target.value }))}
              placeholder="Ex: Seg a Sex, 08:00 às 21:00"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Instruções de Acesso</label>
            <textarea
              className="input text-xs min-h-[60px]"
              value={draft.accessInstructions}
              onChange={(e) => setDraft((p) => ({ ...p, accessInstructions: e.target.value }))}
              placeholder="Explique como o aluno sobe até o local..."
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">URL da Foto de Capa</label>
            <input
              className="input text-xs"
              value={draft.coverPhotoUrl}
              onChange={(e) => setDraft((p) => ({ ...p, coverPhotoUrl: e.target.value }))}
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <button
            type="button"
            onClick={goToNextStep}
            className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <span>Avançar para Armários</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ETAPA 2 — COMPARTIMENTOS */}
      {step === 2 && (
        <div className="card space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
            Adicionar Compartimentos de Lockers
          </h3>

          <div className="flex gap-2 items-end bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-700 block mb-1">Identificação / Código</label>
              <input
                className="input text-xs uppercase"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Ex: H-05"
              />
            </div>
            <div className="w-32">
              <label className="text-xs font-bold text-slate-700 block mb-1">Tamanho</label>
              <select
                className="input text-xs"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value as LockerSize)}
              >
                {LOCKER_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {lockerSizeLabels[s]}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddLocker}
              className="btn-primary px-4 py-2.5 text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            <span className="text-xs font-bold text-slate-500 block">
              Total configurado: {draft.lockersData.length} compartimentos
            </span>
            {draft.lockersData.map((locker, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 font-bold flex items-center justify-center text-slate-800">
                    {locker.code}
                  </span>
                  <span className="font-semibold text-slate-700">
                    Tamanho {lockerSizeLabels[locker.size]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLocker(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <button
              type="button"
              onClick={goToNextStep}
              className="btn-primary flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <span>Avançar para Preços</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 3 — PREÇOS E REGRAS */}
      {step === 3 && (
        <div className="card space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
            Definir Tabela de Preços e Regras de Uso
          </h3>

          <div className="space-y-3">
            {LOCKER_SIZES.map((size) => (
              <div key={size} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-800">
                  Tamanho {lockerSizeLabels[size]}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {RENTAL_PERIODS.map((period) => (
                    <div key={period}>
                      <label className="text-[11px] text-slate-500 block mb-1">
                        {periodLabels[period]} (R$)
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="input text-xs"
                        value={draft.pricesBrl[size][period]}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraft((p) => ({
                            ...p,
                            pricesBrl: {
                              ...p.pricesBrl,
                              [size]: {
                                ...p.pricesBrl[size],
                                [period]: val,
                              },
                            },
                          }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Regras de Utilização do Espaço</label>
            <textarea
              className="input text-xs min-h-[60px]"
              value={draft.usageRules}
              onChange={(e) => setDraft((p) => ({ ...p, usageRules: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn-secondary flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <button
              type="button"
              onClick={goToNextStep}
              className="btn-primary flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <span>Ver Prévia</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 4 — PRÉVIA E ENVIO */}
      {step === 4 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="card space-y-3 border-brand-200 bg-brand-50/20">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-brand-100">
              <ShieldCheck className="w-4 h-4 text-brand-600" /> Prévia do Ponto antes do Envio
            </h3>

            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Nome:</span>
                <span className="font-bold text-slate-900">{draft.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Localização:</span>
                <span className="text-right">
                  {draft.campus} — {draft.building}, {draft.block} ({draft.floor})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Horário:</span>
                <span>{draft.openingHours}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total de Compartimentos:</span>
                <span className="font-bold text-brand-700">
                  {draft.lockersData.length} armários
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-1">Divisão de Receitas (Modelo MVP):</span>
              <p className="text-slate-500">
                • <strong>90%</strong> do valor de cada aluguel vai diretamente para a sua organização.
                <br />• <strong>10%</strong> taxa de operação da plataforma UniLocker.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => setStep(3)}
              className="btn-secondary flex-1 py-3.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" /> Ajustar Preços
            </button>
            <button
              type="submit"
              disabled={pending}
              className="btn-primary flex-1 py-3.5 text-xs font-bold shadow-lg shadow-brand-600/25"
            >
              {pending ? <Spinner /> : <Check className="w-4 h-4 inline mr-1" />}
              Submeter para Aprovação
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
