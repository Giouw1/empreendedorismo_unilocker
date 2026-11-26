import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EllipsisVertical, GraduationCap, Presentation } from 'lucide-react';
import { DEMO_PERSONAS, homePathFor, useAuth } from '../../contexts/AuthContext';
import { useAction } from '../../hooks/useAsync';
import { ErrorAlert, Spinner } from '../ui';

export type UsageIntent = 'store' | 'host';

const personaIcons = [GraduationCap, Presentation];

/**
 * Cartão de login. O menu de três pontinhos no canto guarda os acessos rápidos
 * de apresentação (Aluno e Professor), discretos para não poluir o login real.
 */
export function LoginCard({ intent, title = 'Entrar' }: { intent?: UsageIntent | null; title?: string }) {
  const { login, loginAsPersona } = useAuth();
  const navigate = useNavigate();
  const { pending, error, run } = useAction();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const subtitle =
    intent === 'host'
      ? 'Entre para cadastrar seu espaço e acompanhar seus lockers.'
      : intent === 'store'
        ? 'Entre para reservar um locker perto da sua aula.'
        : 'Use seu e-mail da universidade.';

  const finish = (user: Awaited<ReturnType<typeof login>> | undefined) => {
    if (user) navigate(homePathFor(user), { replace: true });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    finish(await run(() => login({ email, password })));
  };

  const handlePersona = async (personaEmail: string) => {
    (document.activeElement as HTMLElement | null)?.blur(); // fecha o menu
    finish(await run(() => loginAsPersona(personaEmail)));
  };

  return (
    <div className="card w-full border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-base-content/60">{subtitle}</p>
          </div>

          <div className="dropdown dropdown-end shrink-0">
            <button
              type="button"
              tabIndex={0}
              className="btn btn-ghost btn-sm btn-square text-base-content/50"
              aria-label="Acesso rápido de demonstração"
              title="Acesso rápido de demonstração"
            >
              <EllipsisVertical className="h-4 w-4" />
            </button>
            <ul tabIndex={0} className="dropdown-content menu z-30 mt-1 w-64 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
              <li className="menu-title text-[11px] uppercase tracking-wide">Acesso rápido (apresentação)</li>
              {DEMO_PERSONAS.map((p, i) => {
                const Icon = personaIcons[i] ?? GraduationCap;
                return (
                  <li key={p.email}>
                    <button type="button" disabled={pending} onClick={() => void handlePersona(p.email)} className="items-start gap-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="min-w-0">
                        <span className="block font-medium">{p.label}</span>
                        <span className="block text-xs text-base-content/60">{p.description}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <ErrorAlert message={error} />

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <label className="block">
            <span className="field-label">E-mail</span>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="voce@ufrj.br"
              className="input w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="field-label">Senha</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              className="input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit" disabled={pending} className="btn btn-primary w-full">
            {pending && <Spinner />} Entrar
          </button>
        </form>

        <p className="text-center text-sm text-base-content/60">
          Ainda não tem conta?{' '}
          <Link to="/register" state={{ intent }} className="link link-primary font-medium">
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
