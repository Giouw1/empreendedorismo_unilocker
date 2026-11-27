import { Link, NavLink, Outlet } from 'react-router-dom';
import { AlertOctagon, ArrowLeftRight, Building2, Handshake, LayoutDashboard, ListChecks, Lock, LogOut, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/admin/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Usuários', icon: Users },
  { to: '/admin/partners', label: 'Parceiros', icon: Handshake },
  { to: '/admin/locations', label: 'Pontos', icon: Building2 },
  { to: '/admin/reservations', label: 'Reservas', icon: ListChecks },
  { to: '/admin/incidents', label: 'Ocorrências', icon: AlertOctagon },
];

/** Layout da administração da plataforma: barra lateral na web, menu rolável no celular. */
export default function AdminWebLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-base-200 md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-base-300 bg-base-100 md:flex">
        <Link to="/admin/dashboard" className="flex h-14 items-center gap-2 border-b border-base-300 px-5 font-semibold">
          <Lock className="h-5 w-5 text-primary" /> UniLocker <span className="font-normal text-base-content/60">Admin</span>
        </Link>
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
              <ArrowLeftRight className="h-4 w-4" /> App do usuário
            </Link>
          </li>
          <li>
            <button type="button" onClick={logout} className="min-w-0">
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="truncate">Sair ({user?.name})</span>
            </button>
          </li>
        </ul>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100/95 backdrop-blur md:hidden">
          <div className="flex h-14 items-center gap-2 px-4">
            <Link to="/admin/dashboard" className="flex flex-1 items-center gap-2 font-semibold">
              <Lock className="h-5 w-5 text-primary" /> UniLocker <span className="font-normal text-base-content/60">Admin</span>
            </Link>
            <button type="button" onClick={logout} className="btn btn-ghost btn-sm btn-square text-error" aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Administração">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `btn btn-sm shrink-0 gap-1.5 ${isActive ? 'btn-primary' : 'btn-ghost'}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
