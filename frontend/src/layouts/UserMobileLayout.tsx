import { NavLink, Outlet, Link } from 'react-router-dom';
import { Compass, LayoutDashboard, LifeBuoy, Lock, Ticket, UserCircle } from 'lucide-react';
import { ActiveReservationBanner } from '../components/ActiveReservationBanner';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/app/explore', label: 'Explorar', icon: Compass },
  { to: '/app/reservations', label: 'Reservas', icon: Ticket },
  { to: '/app/support', label: 'Ajuda', icon: LifeBuoy },
  { to: '/app/profile', label: 'Perfil', icon: UserCircle },
];

/**
 * Layout do Usuário.
 * Celular: cabeçalho simples + barra inferior (dock). Web (md+): navegação no topo e conteúdo largo.
 */
export default function UserMobileLayout() {
  const { hasRole } = useAuth();
  const isPartner = hasRole('PARTNER');

  return (
    <div className="min-h-screen bg-base-200">
      <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
          <Link to="/app/explore" className="flex shrink-0 items-center gap-2 text-base font-semibold">
            <Lock className="h-5 w-5 text-primary" /> UniLocker
          </Link>

          <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Navegação principal">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `btn btn-ghost btn-sm gap-1.5 font-medium ${isActive ? 'bg-primary/10 text-primary' : 'text-base-content/70'}`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          {isPartner && (
            <Link to="/partner/dashboard" className="btn btn-ghost btn-sm ml-auto gap-1.5 md:ml-0" title="Ir para o painel do parceiro">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Painel do parceiro</span>
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pt-4 pb-32 md:max-w-6xl md:px-6 md:pt-6 md:pb-12">
        <Outlet />
      </main>

      <ActiveReservationBanner />

      <nav className="dock dock-sm z-30 border-t border-base-300 bg-base-100 md:hidden" aria-label="Navegação principal">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'dock-active text-primary' : 'text-base-content/60')}>
            <Icon className="h-5 w-5" />
            <span className="dock-label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
