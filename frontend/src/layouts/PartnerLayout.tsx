import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Home, ListChecks, Lock, LogOut, Plus, UserCircle, Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/partner/dashboard', label: 'Início', icon: Home },
  { to: '/partner/reservations', label: 'Aluguéis', icon: ListChecks },
  { to: '/partner/financial', label: 'Financeiro', icon: Wallet },
  { to: '/app/profile', label: 'Perfil', icon: UserCircle },
];

/**
 * Layout do Parceiro (quem administra pontos de locker).
 * Celular: cabeçalho + barra inferior. Web (md+): barra lateral fixa e conteúdo largo.
 */
export default function PartnerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-base-200 md:flex">
      {/* Barra lateral (web) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-base-300 bg-base-100 md:flex">
        <Link to="/partner/dashboard" className="flex h-14 items-center gap-2 border-b border-base-300 px-5 font-semibold">
          <Lock className="h-5 w-5 text-primary" /> UniLocker
          <span className="badge badge-soft badge-primary badge-sm">Parceiro</span>
        </Link>
        <div className="px-3 pt-4">
          <Link to="/partner/locations/new" className="btn btn-primary btn-sm w-full">
            <Plus className="h-4 w-4" /> Novo ponto
          </Link>
        </div>
        <ul className="menu w-full flex-1 gap-0.5 px-3 py-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink to={to} className={({ isActive }) => (isActive ? 'bg-primary/10 font-medium text-primary' : '')}>
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
        <ul className="menu w-full border-t border-base-300 p-3 text-sm">
          <li>
            <Link to="/app/explore">
              <ArrowLeftRight className="h-4 w-4" /> Modo usuário
            </Link>
          </li>
          <li>
            <button type="button" onClick={handleLogout} className="min-w-0">
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="truncate">Sair ({user?.name})</span>
            </button>
          </li>
        </ul>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Cabeçalho (celular) */}
        <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100/95 backdrop-blur md:hidden">
          <div className="flex h-14 items-center gap-2 px-4">
            <Link to="/partner/dashboard" className="flex min-w-0 flex-1 items-center gap-2 font-semibold">
              <Lock className="h-5 w-5 shrink-0 text-primary" /> UniLocker
              <span className="badge badge-soft badge-primary badge-sm">Parceiro</span>
            </Link>
            <Link to="/app/explore" className="btn btn-ghost btn-sm btn-square" title="Modo usuário" aria-label="Modo usuário">
              <ArrowLeftRight className="h-4 w-4" />
            </Link>
            <button type="button" onClick={handleLogout} className="btn btn-ghost btn-sm btn-square text-error" title="Sair" aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-28 md:max-w-6xl md:px-8 md:pt-8 md:pb-12">
          <Outlet />
        </main>

        <nav className="dock dock-sm z-30 border-t border-base-300 bg-base-100 md:hidden" aria-label="Navegação do parceiro">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'dock-active text-primary' : 'text-base-content/60')}>
              <Icon className="h-5 w-5" />
              <span className="dock-label">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
