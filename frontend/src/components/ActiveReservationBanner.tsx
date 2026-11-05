import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { reservationsService } from '../services/reservations.service';
import type { ReservationDto } from '../types/api';
import { useCountdown } from '../hooks/useCountdown';
import { KeyRound, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const ActiveReservationBanner: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeReservation, setActiveReservation] = useState<ReservationDto | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setActiveReservation(null);
      return;
    }

    reservationsService
      .listMine()
      .then((res) => {
        if (!isMounted) return;
        const active = res.active?.[0] || null;
        setActiveReservation(active);
      })
      .catch(() => {
        // Silencioso se der erro ou estiver deslogado
      });

    return () => {
      isMounted = false;
    };
  }, [user, location.pathname]);

  const countdown = useCountdown(activeReservation?.endTime);

  // Não exibe se o usuário já estiver na própria tela de detalhes daquela reserva
  if (!activeReservation || location.pathname === `/app/reservations/${activeReservation.id}`) {
    return null;
  }

  return (
    <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-3 animate-in slide-in-from-bottom-2 duration-300">
      <Link
        to={`/app/reservations/${activeReservation.id}`}
        className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-700/25 border border-emerald-500/50 hover:brightness-105 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-black tracking-wide flex items-center gap-1.5">
              <span>Locker {activeReservation.lockerCode || 'Ativo'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
            </div>
            <div className="text-[11px] text-emerald-100 font-mono">
              {countdown.isExpired ? 'Aluguel Expirado' : `Restam ${countdown.formatted}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition-colors">
          <span>Abrir</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </Link>
    </div>
  );
};
