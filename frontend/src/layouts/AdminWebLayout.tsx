import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  AlertOctagon,
  ArrowLeftRight,
  Building2,
  Handshake,
  LayoutDashboard,
  ListChecks,
  Lock,
  LogOut,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/admin/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Usuários', icon: Users },
  { to: '/admin/partners', label: 'Parceiros', icon: Handshake },
  { to: '/admin/locations', label: 'Pontos e lockers', icon: Building2 },
  { to: '/admin/reservations', label: 'Reservas', icon: ListChecks },
  { to: '/admin/incidents', label: 'Ocorrências', icon: AlertOctagon },
];

export default function AdminWebLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-base-200">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-base-300 bg-base-100">
        <Link to="/admin/dashboard" className="flex h-14 items-center gap-2 border-b border-base-300 px-5 font-semibold">
          <Lock className="h-5 w-5 text-primary" /> UniLocker <span className="font-normal text-base-content/60">UFRJ</span>
        </Link>
        <ul className="menu w-full flex-1 gap-0.5 px-3 py-4">
          <li className="menu-title text-xs">Administração</li>
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink to={to} className={({ isActive }) => (isActive ? 'menu-active bg-primary/10! font-medium text-primary!' : '')}>
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
            <button type="button" onClick={logout}>
              <LogOut className="h-4 w-4" /> Sair ({user?.name})
            </button>
          </li>
        </ul>
      </aside>

      <main className="min-w-0 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
