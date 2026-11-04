import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { clearSession, loadSession, saveSession, setUnauthorizedHandler } from '../services/http';
import type { AuthResponseDto, LoginRequest, RegisterRequest, UserDto, UserRole } from '../types/api';

/** Personas de demonstração (seed do backend). Senha padrão: 123456. */
export const DEMO_PASSWORD = '123456';

export interface DemoPersona {
  email: string;
  label: string;
  description: string;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  { email: 'cintra@poli.ufrj.br', label: 'Cintra', description: 'Aluna · aluguel semanal ativo' },
  { email: 'joaquim@letras.ufrj.br', label: 'Joaquim', description: 'Aluno · uso pontual' },
  { email: 'guilherme@eba.ufrj.br', label: 'Prof. Guilherme', description: 'Parceiro aprovado' },
  { email: 'admin@unilocker.ufrj.br', label: 'Admin', description: 'Operação da plataforma' },
];

interface AuthContextValue {
  user: UserDto | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<UserDto>;
  register: (payload: RegisterRequest) => Promise<UserDto>;
  loginAsPersona: (email: string) => Promise<UserDto>;
  logout: () => void;
  refreshUser: () => Promise<UserDto | null>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Rota inicial após login, de acordo com os perfis do usuário. */
export function homePathFor(user: UserDto | null): string {
  if (!user) return '/login';
  if (user.roles.includes('ADMIN')) return '/admin/dashboard';
  return '/app/explore';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const initial = loadSession();
  const [user, setUser] = useState<UserDto | null>(initial?.user ?? null);
  const [token, setToken] = useState<string | null>(initial?.accessToken ?? null);

  const applySession = useCallback((session: AuthResponseDto) => {
    saveSession(session);
    setToken(session.accessToken);
    setUser(session.user);
    return session.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  // Em caso de 401 vindo de qualquer chamada, limpa sessão e redireciona para /login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
      navigate('/login', { replace: true });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  const login = useCallback(
    async (payload: LoginRequest) => applySession(await authService.login(payload)),
    [applySession],
  );

  const register = useCallback(
    async (payload: RegisterRequest) => applySession(await authService.register(payload)),
    [applySession],
  );

  const loginAsPersona = useCallback(
    async (email: string) => applySession(await authService.login({ email, password: DEMO_PASSWORD })),
    [applySession],
  );

  const refreshUser = useCallback(async () => {
    if (!loadSession()) return null;
    const fresh = await authService.getMe();
    const session = loadSession();
    if (session) saveSession({ accessToken: session.accessToken, user: fresh });
    setUser(fresh);
    return fresh;
  }, []);

  // Sincroniza o perfil (roles/partnerStatus podem ter mudado no servidor).
  useEffect(() => {
    if (token) {
      refreshUser().catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasRole = useCallback((role: UserRole) => !!user?.roles.includes(role), [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      login,
      register,
      loginAsPersona,
      logout,
      refreshUser,
      hasRole,
    }),
    [user, token, login, register, loginAsPersona, logout, refreshUser, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  return ctx;
}
