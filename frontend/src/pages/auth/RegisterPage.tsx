import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { homePathFor, useAuth } from '../../contexts/AuthContext';
import { useAction } from '../../hooks/useAsync';
import { ErrorAlert, Spinner } from '../../components/ui';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const intent = (useLocation().state as { intent?: string } | null)?.intent;
  const { pending, error, run } = useAction();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [universityAffiliation, setUniversityAffiliation] = useState('Aluno — UFRJ');
  const [password, setPassword] = useState('');

  // TODO [PLANO-FRONTEND]: adicionar validação de confirmação de senha e seletor de unidade UFRJ.
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const user = await run(() => register({ name, email, password, universityAffiliation }));
    // Quem escolheu "Ganhar com meu espaço" segue direto para o cadastro de parceiro.
    if (user) navigate(intent === 'host' ? '/partner/apply' : homePathFor(user), { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 px-4 py-8">
      <div className="panel w-full max-w-sm space-y-4 p-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold text-primary">
            <Lock className="h-5 w-5" /> UniLocker UFRJ
          </Link>
          <h1 className="mt-2 text-lg font-bold">Criar conta</h1>
        </div>

        <ErrorAlert message={error} />

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div>
            <label className="field-label">Nome completo</label>
            <input required className="input w-full" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="field-label">E-mail institucional ou pessoal</label>
            <input type="email" required className="input w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Vínculo universitário</label>
            <input
              required
              className="input w-full"
              placeholder="Ex.: Aluno — Engenharia (CT)"
              value={universityAffiliation}
              onChange={(e) => setUniversityAffiliation(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Senha</label>
            <input
              type="password"
              required
              minLength={6}
              className="input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={pending} className="btn btn-primary w-full">
            {pending && <Spinner />} Criar minha conta
          </button>
        </form>

        <p className="text-center text-sm text-base-content/60">
          Já possui conta?{' '}
          <Link to="/login" className="link link-primary font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
