import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { homePathFor, useAuth } from '../../contexts/AuthContext';
import { useAction } from '../../hooks/useAsync';
import { ErrorAlert, Spinner } from '../../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { pending, error, run } = useAction();
  const [email, setEmail] = useState('cintra@poli.ufrj.br');
  const [password, setPassword] = useState('123456');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const user = await run(() => login({ email, password }));
    if (user) navigate(homePathFor(user), { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="card w-full max-w-sm space-y-4 p-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-brand-700">
            <Lock className="h-5 w-5" /> UniLocker UFRJ
          </Link>
          <h1 className="mt-2 text-lg font-bold">Entrar na plataforma</h1>
        </div>

        <ErrorAlert message={error} />

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div>
            <label className="label">E-mail</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Senha</label>
            <input
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending && <Spinner />} Entrar
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Ainda não tem conta?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
