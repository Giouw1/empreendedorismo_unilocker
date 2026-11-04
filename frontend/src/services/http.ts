import axios, { AxiosError } from 'axios';
import type { ApiErrorResponse, AuthResponseDto, UserDto } from '../types/api';

export const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const SESSION_STORAGE_KEY = 'unilocker.session';

export interface StoredSession {
  accessToken: string;
  user: UserDto;
}

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.accessToken || !parsed?.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthResponseDto | StoredSession): void {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ accessToken: session.accessToken, user: session.user }),
  );
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

/** Callback registrado pelo AuthContext para reagir a 401 (sessão expirada/inválida). */
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export const http = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const session = loadSession();
  if (session?.accessToken) {
    config.headers.set('Authorization', `Bearer ${session.accessToken}`);
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register');
    if (status === 401 && !isAuthCall) {
      clearSession();
      if (unauthorizedHandler) {
        unauthorizedHandler();
      } else if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

/** Extrai uma mensagem amigável (pt-BR) de qualquer erro vindo do Axios/NestJS. */
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as Partial<ApiErrorResponse> | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(' • ') : data.message;
    }
    if (!err.response) {
      return 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.';
    }
    if (err.response.status === 401) return 'Sessão expirada. Faça login novamente.';
    if (err.response.status === 403) return 'Você não tem permissão para esta ação.';
    if (err.response.status === 404) return 'Recurso não encontrado.';
    return `Erro inesperado (HTTP ${err.response.status}).`;
  }
  if (err instanceof Error) return err.message;
  return 'Erro inesperado.';
}

/** Remove chaves vazias/undefined de objetos de filtro antes de enviá-los como query string. */
export function cleanParams<T extends object>(params?: T): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const result: Record<string, string | number | boolean> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value as string | number | boolean;
    }
  });
  return result;
}
