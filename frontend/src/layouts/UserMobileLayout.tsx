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
    <div className="min-h-screen bg-slate-100">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-slate-50 shadow-sm">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <Link to="/app/explore" className="flex items-center gap-2 font-bold text-brand-700">
            <Lock className="h-5 w-5" /> UniLocker UFRJ
          </Link>
        </header>

        <main className="flex-1 px-4 pt-4 pb-28">
          <Outlet />
        </main>

        <ActiveReservationBanner />

        <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white shadow-lg">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                  isActive ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
