import { http } from './http';
import type {
  CompleteReservationRequest,
  CreateReservationRequest,
  ExtendReservationRequest,
  MyReservationsResponse,
  ReservationDto,
} from '../types/api';

export const reservationsService = {
  async create(payload: CreateReservationRequest): Promise<ReservationDto> {
    const { data } = await http.post<ReservationDto>('/reservations', payload);
    return data;
  },

  async listMine(): Promise<MyReservationsResponse> {
    const { data } = await http.get<MyReservationsResponse>('/reservations/me');
    return data;
  },

  async getById(id: string): Promise<ReservationDto> {
    const { data } = await http.get<ReservationDto>(`/reservations/${id}`);
    return data;
  },

  async extend(id: string, payload: ExtendReservationRequest): Promise<ReservationDto> {
    const { data } = await http.post<ReservationDto>(`/reservations/${id}/extend`, payload);
    return data;
  },

  async complete(id: string, payload: CompleteReservationRequest): Promise<ReservationDto> {
    const { data } = await http.post<ReservationDto>(`/reservations/${id}/complete`, payload);
    return data;
  },

  async cancel(id: string): Promise<ReservationDto> {
    const { data } = await http.post<ReservationDto>(`/reservations/${id}/cancel`);
    return data;
  },
};
