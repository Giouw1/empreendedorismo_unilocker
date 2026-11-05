import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Building2, LayoutDashboard, ListChecks, Lock, LogOut, UserCircle, Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/partner/dashboard', label: 'Painel', icon: LayoutDashboard },
  // TODO [PLANO-FRONTEND]: criar listagem dedicada "Meus pontos" (/partner/locations); por ora leva ao cadastro.
  { to: '/partner/locations/new', label: 'Meus pontos', icon: Building2 },
  { to: '/partner/reservations', label: 'Aluguéis', icon: ListChecks },
  { to: '/partner/financial', label: 'Financeiro', icon: Wallet },
  { to: '/app/profile', label: 'Perfil', icon: UserCircle },
];

/** Layout da área do Parceiro/Ofertador (mobile-first, mais largo que o do usuário). */
export default function PartnerLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col bg-slate-50 shadow-sm">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <Link to="/partner/dashboard" className="flex items-center gap-2 font-bold text-brand-700">
              <Lock className="h-5 w-5" /> UniLocker UFRJ
              <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase">
                Parceiro
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/app/explore" className="btn-secondary px-2.5 py-1 text-xs" title="Voltar ao modo Usuário">
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Modo Usuário</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-secondary px-2.5 py-1 text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                title="Encerrar sessão"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-2 pb-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="flex-1 px-4 py-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
