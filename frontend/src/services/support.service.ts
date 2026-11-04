import { http } from './http';
import type { CreateTicketRequest, SupportTicketDto } from '../types/api';

export const supportService = {
  async createTicket(payload: CreateTicketRequest): Promise<SupportTicketDto> {
    const { data } = await http.post<SupportTicketDto>('/support/tickets', payload);
    return data;
  },

  async listMine(): Promise<SupportTicketDto[]> {
    const { data } = await http.get<SupportTicketDto[]>('/support/tickets/me');
    return data;
  },
};
