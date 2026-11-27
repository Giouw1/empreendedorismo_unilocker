import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { LoginCard } from '../../components/auth/LoginCard';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-base-200 px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-2 text-lg font-semibold">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-field bg-primary text-primary-content">
          <Lock className="h-5 w-5" />
        </span>
        UniLocker
      </Link>
      <div className="w-full max-w-sm">
        <LoginCard title="Entrar na sua conta" />
      </div>
    </div>
  );
}
