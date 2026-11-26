import { NavLink, Outlet, Link } from 'react-router-dom';
import { Compass, LifeBuoy, Lock, Ticket, UserCircle } from 'lucide-react';
import { ActiveReservationBanner } from '../components/ActiveReservationBanner';

const navItems = [
  { to: '/app/explore', label: 'Explorar', icon: Compass },
  { to: '/app/reservations', label: 'Minhas reservas', icon: Ticket },
  { to: '/app/support', label: 'Ajuda', icon: LifeBuoy },
  { to: '/app/profile', label: 'Perfil', icon: UserCircle },
];

/** Layout mobile-first do Usuário: container centralizado + barra inferior fixa + banner de reserva ativa. */
export default function UserMobileLayout() {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-base-200 shadow-sm">
        <header className="navbar sticky top-0 z-20 min-h-14 border-b border-base-300 bg-base-100 px-4">
          <Link to="/app/explore" className="flex items-center gap-2 text-base font-semibold">
            <Lock className="h-5 w-5 text-primary" /> UniLocker <span className="font-normal text-base-content/60">UFRJ</span>
          </Link>
        </header>

        <main className="flex-1 px-4 pt-4 pb-28">
          <Outlet />
        </main>

        <ActiveReservationBanner />

        <nav className="dock dock-sm fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-base-300 bg-base-100">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? 'dock-active text-primary' : 'text-base-content/60')}
            >
              <Icon className="h-5 w-5" />
              <span className="dock-label">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
