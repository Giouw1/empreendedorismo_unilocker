import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Hourglass, KeyRound } from 'lucide-react';
import { reservationsService } from '../services/reservations.service';
import type { ReservationDto } from '../types/api';
import { useCountdown } from '../hooks/useCountdown';
import { useAuth } from '../contexts/AuthContext';

/** Atalho flutuante para a reserva em andamento (pré-reserva ou aluguel ativo). */
export function ActiveReservationBanner() {
  const { user } = useAuth();
  const location = useLocation();
  const [current, setCurrent] = useState<ReservationDto | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!user) {
      setCurrent(null);
      return;
    }
    reservationsService
      .listMine()
      .then((res) => {
        if (!mounted) return;
        // Prioriza o aluguel ativo; senão, a pré-reserva mais recente.
        setCurrent(res.active.find((r) => r.status === 'Active') ?? res.active.find((r) => r.status === 'PendingConfirmation') ?? null);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [user, location.pathname]);

  const countdown = useCountdown(current?.endTime);

  if (!current || location.pathname.startsWith(`/app/reservations/${current.id}`)) return null;

  const pending = current.status === 'PendingConfirmation';
  const Icon = pending ? Hourglass : KeyRound;

  return (
    <div className="fixed inset-x-0 bottom-16 z-20 mx-auto w-full max-w-md px-3 md:inset-x-auto md:right-6 md:bottom-20 md:w-96 md:px-0">
      <Link
        to={`/app/reservations/${current.id}`}
        className={`flex items-center gap-3 rounded-box p-3 shadow-lg transition hover:brightness-105 ${
          pending ? 'bg-warning text-warning-content' : 'bg-success text-success-content'
        }`}
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-field bg-white/25">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">Locker {current.lockerCode} · {current.locationName}</span>
          <span className="block truncate text-xs opacity-80">
            {pending ? 'Aguardando confirmação no local' : countdown.isExpired ? 'Aluguel vencido' : `Restam ${countdown.formatted}`}
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 opacity-80" />
      </Link>
    </div>
  );
}
