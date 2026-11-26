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
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col bg-base-200">
        <header className="sticky top-0 z-20 border-b border-base-300 bg-base-100">
          <div className="navbar min-h-14 gap-2 px-4">
            <Link to="/partner/dashboard" className="flex flex-1 items-center gap-2 text-base font-semibold">
              <Lock className="h-5 w-5 text-primary" /> UniLocker
              <span className="badge badge-warning badge-soft badge-sm">Parceiro</span>
            </Link>
            <Link to="/app/explore" className="btn btn-ghost btn-sm" title="Voltar ao modo Usuário">
              <ArrowLeftRight className="h-4 w-4" />
              <span className="hidden sm:inline">Modo usuário</span>
            </Link>
            <button type="button" onClick={handleLogout} className="btn btn-ghost btn-sm text-error" title="Encerrar sessão">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
          <nav role="tablist" className="tabs tabs-border overflow-x-auto px-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                role="tab"
                className={({ isActive }) => `tab gap-1.5 whitespace-nowrap ${isActive ? 'tab-active' : ''}`}
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
