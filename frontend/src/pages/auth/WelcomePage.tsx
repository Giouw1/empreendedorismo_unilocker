import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Backpack, CalendarCheck, Check, HandCoins, KeyRound, Lock, MapPin, ShieldCheck, Wallet } from 'lucide-react';
import { homePathFor, useAuth } from '../../contexts/AuthContext';
import { LoginCard, type UsageIntent } from '../../components/auth/LoginCard';

const usageOptions: {
  value: UsageIntent;
  title: string;
  description: string;
  icon: typeof Backpack;
  steps: { icon: typeof Backpack; text: string }[];
}[] = [
  {
    value: 'store',
    title: 'Guardar minhas coisas',
    description: 'Um locker perto da sua aula, por dia, semana ou mês.',
    icon: Backpack,
    steps: [
      { icon: MapPin, text: 'Escolha um ponto no seu campus' },
      { icon: CalendarCheck, text: 'Pré-reserve pelo app em segundos' },
      { icon: KeyRound, text: 'Confirme no local e comece a usar' },
    ],
  },
  {
    value: 'host',
    title: 'Ganhar com meu espaço',
    description: 'Transforme um canto ocioso do seu laboratório ou CA em renda.',
    icon: HandCoins,
    steps: [
      { icon: Lock, text: 'Cadastre o ponto e os lockers' },
      { icon: ShieldCheck, text: 'Confirme quem chega para usar' },
      { icon: Wallet, text: 'Receba 90% de cada aluguel' },
    ],
  },
];

export default function WelcomePage() {
  const { isAuthenticated, user } = useAuth();
  const [intent, setIntent] = useState<UsageIntent | null>(null);
  const loginRef = useRef<HTMLDivElement>(null);

  const choose = (value: UsageIntent) => {
    setIntent(value);
    window.setTimeout(() => loginRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const selected = usageOptions.find((o) => o.value === intent);

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto w-full max-w-md px-4 pt-10 pb-24 md:max-w-4xl md:pt-16">
        {/* Apresentação */}
        <header className="space-y-3 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-box bg-primary text-primary-content shadow-md">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">UniLocker</h1>
          <p className="mx-auto max-w-md text-base text-base-content/70">
            Guarda-volumes na universidade, reservados pelo celular. Para quem precisa guardar e para quem tem espaço sobrando.
          </p>
        </header>

        {/* Escolha de uso */}
        <section className="mt-8 space-y-3" aria-labelledby="usage-title">
          <h2 id="usage-title" className="text-center text-sm font-medium text-base-content/60">
            Como você quer usar o UniLocker?
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {usageOptions.map(({ value, title, description, icon: Icon }) => {
              const active = intent === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => choose(value)}
                  aria-pressed={active}
                  className={`group flex w-full items-center gap-4 rounded-box border bg-base-100 p-4 text-left shadow-xs transition-all hover:border-primary/60 hover:shadow-md md:flex-col md:items-start md:p-6 ${
                    active ? 'border-primary ring-2 ring-primary/20' : 'border-base-300'
                  }`}
                >
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-box bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold">{title}</span>
                    <span className="mt-0.5 block text-sm text-base-content/60">{description}</span>
                  </span>
                  <span className="shrink-0 md:hidden">
                    {active ? <Check className="h-5 w-5 text-primary" /> : <ArrowRight className="h-5 w-5 text-base-content/30 transition-transform group-hover:translate-x-0.5" />}
                  </span>
                </button>
              );
            })}
          </div>

          {selected && (
            <ol className="grid gap-2 rounded-box border border-base-300 bg-base-100 p-4 md:grid-cols-3">
              {selected.steps.map(({ icon: Icon, text }, i) => (
                <li key={text} className="flex items-center gap-3 text-sm">
                  <span className="icon-chip h-8 w-8">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="text-xs text-base-content/50">Passo {i + 1}</span>
                    <span className="block font-medium">{text}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Login */}
        <section ref={loginRef} className="mx-auto mt-10 w-full max-w-sm scroll-mt-6">
          {isAuthenticated ? (
            <div className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body items-center gap-3 p-6 text-center">
                <p className="text-sm text-base-content/60">Você já está conectado.</p>
                <Link to={homePathFor(user)} className="btn btn-primary w-full">
                  Continuar como {user?.name} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <LoginCard intent={intent} />
          )}
        </section>
      </div>
    </div>
  );
}
