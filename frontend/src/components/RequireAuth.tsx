import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/api';

/** Exige sessão ativa e, opcionalmente, um perfil específico. */
export function RequireAuth({ role, children }: { role?: UserRole; children: ReactNode }) {
  const { isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (role && !hasRole(role)) {
    // Parceiro sem aprovação é levado ao perfil (onde vê o status / convite).
    return <Navigate to={role === 'PARTNER' ? '/app/profile' : '/app/explore'} replace />;
  }
  return <>{children}</>;
}
