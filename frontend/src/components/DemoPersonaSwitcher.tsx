import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, X, ArrowRight, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { DEMO_PERSONAS, homePathFor, useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../services/http';

/**
 * Seletor de Troca Rápida de Persona + Guia do Apresentador para Pitch.
 */
export function DemoPersonaSwitcher({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { user, loginAsPersona } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const handleChange = async (email: string) => {
    if (!email || email === user?.email) return;
    setPending(true);
    setError(null);
    try {
      const logged = await loginAsPersona(email);
      navigate(homePathFor(logged), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  const handleSelectPersonaFromGuide = async (email: string) => {
    await handleChange(email);
    setGuideOpen(false);
  };

  const base =
    variant === 'dark'
      ? 'bg-slate-800 text-slate-100 border-slate-700'
      : 'bg-white text-slate-700 border-slate-300';

  const pitchSteps = [
    {
      time: 'Minuto 1 a 2',
      persona: 'cintra@poli.ufrj.br',
      name: 'Cintra (Poli / CT)',
      role: 'Estudante — Uso Recorrente',
      focus: 'Abertura rápida no app, mapa interativo do Fundão e cronômetro ao vivo.',
      actionText: 'Demonstrar Cintra',
    },
    {
      time: 'Minuto 3 a 4',
      persona: 'joaquim@letras.ufrj.br',
      name: 'Joaquim (Letras)',
      role: 'Estudante — Uso Pontual',
      focus: 'Contratação instantânea no Checkout, destravamento eletrônico e devolução.',
      actionText: 'Demonstrar Joaquim',
    },
    {
      time: 'Minuto 4 a 5',
      persona: 'guilherme@eba.ufrj.br',
      name: 'Prof. Guilherme (EBA)',
      role: 'Ofertador — Parceiro',
      focus: 'Painel do parceiro, grade física dos armários e divisão financeira 90% / 10%.',
      actionText: 'Demonstrar Guilherme',
    },
    {
      time: 'Minuto 5 a 6',
      persona: 'admin@unilocker.ufrj.br',
      name: 'Admin UniLocker',
      role: 'Governança & Escala',
      focus: 'GMV total da rede, aprovação da Cantina CCMN e supervisão operacional.',
      actionText: 'Demonstrar Admin',
    },
  ];

  return (
    <>
      <div className="flex items-center gap-1.5" title={error ?? 'Troca rápida de persona (demo)'}>
        <Users className={`h-4 w-4 ${variant === 'dark' ? 'text-slate-300' : 'text-slate-500'}`} />
        <select
          aria-label="Trocar persona de demonstração"
          className={`max-w-[9.5rem] rounded-lg border px-2 py-1 text-xs ${base} ${error ? 'border-red-400' : ''}`}
          value={DEMO_PERSONAS.some((p) => p.email === user?.email) ? user?.email : ''}
          disabled={pending}
          onChange={(e) => void handleChange(e.target.value)}
        >
          <option value="">{pending ? 'Entrando...' : 'Demo: persona'}</option>
          {DEMO_PERSONAS.map((p) => (
            <option key={p.email} value={p.email}>
              {p.label}
            </option>
          ))}
        </select>

        {/* Botão de Apoio do Pitch */}
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
            variant === 'dark'
              ? 'border-brand-500/50 bg-brand-900/60 text-brand-200 hover:bg-brand-900'
              : 'border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100'
          }`}
          title="Abrir Guia do Pitch para Apresentação"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Guia Pitch</span>
        </button>
      </div>

      {/* Modal / Gaveta do Guia do Pitch */}
      {guideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-brand-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Guia do Apresentador
                </span>
                <h3 className="text-lg font-black text-slate-900">Roteiro do Pitch — 5 a 7 Minutos</h3>
              </div>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {pitchSteps.map((s, idx) => {
                const isCurrent = user?.email === s.persona;
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border-2 transition-all ${
                      isCurrent
                        ? 'border-brand-600 bg-brand-50/60 shadow-sm'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {s.time}
                      </span>
                      {isCurrent ? (
                        <span className="px-2 py-0.5 rounded-full bg-brand-600 text-white font-bold text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Na tela agora
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-500">{s.role}</span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                    <p className="text-xs text-slate-600 mt-1">{s.focus}</p>

                    <div className="pt-2 mt-2 border-t border-slate-200/60 flex justify-end">
                      <button
                        type="button"
                        disabled={pending || isCurrent}
                        onClick={() => void handleSelectPersonaFromGuide(s.persona)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                          isCurrent
                            ? 'bg-slate-200 text-slate-400 cursor-default'
                            : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20 active:scale-95'
                        }`}
                      >
                        <span>{s.actionText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Consulte o roteiro completo em <code className="font-mono text-slate-700">docs/ROTEIRO_PITCH.md</code></span>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="btn-secondary px-3 py-1.5 text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
