import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  AlertOctagon,
  Building2,
  Handshake,
  LayoutDashboard,
  ListChecks,
  Lock,
  LogOut,
  Users,
} from 'lucide-react';
import { DemoPersonaSwitcher } from '../components/DemoPersonaSwitcher';
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
    <div className="flex min-h-screen bg-slate-100">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-slate-900 text-slate-200">
        <Link to="/admin/dashboard" className="flex items-center gap-2 px-5 py-5 font-bold text-white">
          <Lock className="h-5 w-5 text-brand-500" /> UniLocker UFRJ
        </Link>
        <p className="px-5 pb-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Administração</p>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-3 border-t border-slate-800 p-4">
          <DemoPersonaSwitcher variant="dark" />
          <Link to="/app/explore" className="block text-xs text-slate-400 hover:text-white">
            Ir para o app do usuário →
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" /> Sair ({user?.name})
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
