import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Lock, MapPin, ShieldCheck, Users } from 'lucide-react';
import { DEMO_PERSONAS, homePathFor, useAuth } from '../../contexts/AuthContext';
import { useAction } from '../../hooks/useAsync';
import { ErrorAlert, Spinner } from '../../components/ui';

export default function WelcomePage() {
  const { isAuthenticated, user, loginAsPersona } = useAuth();
  const navigate = useNavigate();
  const { pending, error, run } = useAction();

  const handleQuickPersona = async (email: string) => {
    const logged = await run(() => loginAsPersona(email));
    if (logged) navigate(homePathFor(logged));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-slate-100 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">UniLocker UFRJ</h1>
          <p className="mx-auto max-w-lg text-sm text-slate-600">
            Rede universitária de guarda-volumes inteligente conectando laboratórios, centros acadêmicos e estabelecimentos a estudantes e funcionários no campus.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="card text-center">
            <MapPin className="mx-auto mb-2 h-6 w-6 text-brand-600" />
            <h3 className="text-sm font-bold">Perto da sua aula</h3>
            <p className="mt-1 text-xs text-slate-500">Encontre lockers em prédios e blocos do campus.</p>
          </div>
          <div className="card text-center">
            <ShieldCheck className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
            <h3 className="text-sm font-bold">Acesso pelo celular</h3>
            <p className="mt-1 text-xs text-slate-500">Reserve diária, semana ou mês e destrave pelo app.</p>
          </div>
          <div className="card text-center">
            <Building2 className="mx-auto mb-2 h-6 w-6 text-amber-600" />
            <h3 className="text-sm font-bold">Renda p/ espaços</h3>
            <p className="mt-1 text-xs text-slate-500">Laboratórios e CAs monetizam áreas ociosas.</p>
          </div>
        </div>

        <div className="card flex flex-wrap items-center justify-center gap-3 p-6">
          {isAuthenticated ? (
            <Link to={homePathFor(user)} className="btn-primary">
              Continuar como {user?.name} <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-primary">
                Entrar na conta
              </Link>
              <Link to="/register" className="btn-secondary">
                Criar conta gratuita
              </Link>
            </>
          )}
        </div>

        {/* Painel de Demonstração Rápida p/ Pitch */}
        <div className="card space-y-3 border-brand-100 bg-brand-50/50">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-brand-700 uppercase">
            <Users className="h-4 w-4" /> Acesso Rápido p/ Demonstração (Personas MVP)
          </div>
          <ErrorAlert message={error} />
          <div className="grid gap-2 sm:grid-cols-2">
            {DEMO_PERSONAS.map((persona) => (
              <button
                key={persona.email}
                type="button"
                disabled={pending}
                onClick={() => void handleQuickPersona(persona.email)}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-brand-500 hover:shadow-sm disabled:opacity-50"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">{persona.label}</p>
                  <p className="text-xs text-slate-500">{persona.description}</p>
                </div>
                {pending ? <Spinner /> : <ArrowRight className="h-4 w-4 text-brand-600" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
