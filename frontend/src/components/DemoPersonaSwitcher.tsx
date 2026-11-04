import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { DEMO_PERSONAS, homePathFor, useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../services/http';

/**
 * Seletor compacto de Troca Rápida de Persona (Demo Mode).
 * TODO [PLANO-FRONTEND]: esconder em builds de produção (flag de ambiente).
 */
export function DemoPersonaSwitcher({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { user, loginAsPersona } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const base =
    variant === 'dark'
      ? 'bg-slate-800 text-slate-100 border-slate-700'
      : 'bg-white text-slate-700 border-slate-300';

  return (
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
    </div>
  );
}
