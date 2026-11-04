import { http } from './http';
import type { AccessEventDto } from '../types/api';

export const accessService = {
  async unlock(reservationId: string): Promise<AccessEventDto> {
    const { data } = await http.post<AccessEventDto>(`/reservations/${reservationId}/unlock`);
    return data;
  },

  async listEvents(reservationId: string): Promise<AccessEventDto[]> {
    const { data } = await http.get<AccessEventDto[]>(`/reservations/${reservationId}/access-events`);
    return data;
  },
};
