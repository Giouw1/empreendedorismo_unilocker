import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { homePathFor, useAuth } from '../../contexts/AuthContext';
import { useAction } from '../../hooks/useAsync';
import { ErrorAlert, Spinner } from '../../components/ui';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { pending, error, run } = useAction();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [universityAffiliation, setUniversityAffiliation] = useState('Aluno — UFRJ');
  const [password, setPassword] = useState('');

  // TODO [PLANO-FRONTEND]: adicionar validação de confirmação de senha e seletor de unidade UFRJ.
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const user = await run(() => register({ name, email, password, universityAffiliation }));
    if (user) navigate(homePathFor(user), { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="card w-full max-w-sm space-y-4 p-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-brand-700">
            <Lock className="h-5 w-5" /> UniLocker UFRJ
          </Link>
          <h1 className="mt-2 text-lg font-bold">Criar conta</h1>
        </div>

        <ErrorAlert message={error} />

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div>
            <label className="label">Nome completo</label>
            <input required className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">E-mail institucional ou pessoal</label>
            <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Vínculo universitário</label>
            <input
              required
              className="input"
              placeholder="Ex.: Aluno — Engenharia (CT)"
              value={universityAffiliation}
              onChange={(e) => setUniversityAffiliation(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Senha</label>
            <input
              type="password"
              required
              minLength={4}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending && <Spinner />} Criar minha conta
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Já possui conta?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
