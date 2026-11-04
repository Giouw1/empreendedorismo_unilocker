import { http } from './http';
import type {
  AuthResponseDto,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  UserDto,
} from '../types/api';

export const authService = {
  async register(payload: RegisterRequest): Promise<AuthResponseDto> {
    const { data } = await http.post<AuthResponseDto>('/auth/register', payload);
    return data;
  },

  async login(payload: LoginRequest): Promise<AuthResponseDto> {
    const { data } = await http.post<AuthResponseDto>('/auth/login', payload);
    return data;
  },

  async getMe(): Promise<UserDto> {
    const { data } = await http.get<UserDto>('/users/me');
    return data;
  },

  async updateMe(payload: UpdateProfileRequest): Promise<UserDto> {
    const { data } = await http.patch<UserDto>('/users/me', payload);
    return data;
  },
};
