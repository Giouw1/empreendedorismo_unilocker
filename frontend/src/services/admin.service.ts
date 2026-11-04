import { cleanParams, http } from './http';
import type {
  AdminDashboardDto,
  AdminReservationFilters,
  LocationDetailDto,
  LocationStatus,
  PartnerDto,
  ReservationDto,
  ResolveIncidentRequest,
  ReviewRequest,
  SupportTicketDto,
  TicketStatus,
  UserDto,
} from '../types/api';

export const adminService = {
  async getDashboard(): Promise<AdminDashboardDto> {
    const { data } = await http.get<AdminDashboardDto>('/admin/dashboard');
    return data;
  },

  async listUsers(search?: string): Promise<UserDto[]> {
    const { data } = await http.get<UserDto[]>('/admin/users', { params: cleanParams({ search }) });
    return data;
  },

  async listPartners(includeAll?: boolean): Promise<PartnerDto[]> {
    const { data } = await http.get<PartnerDto[]>('/admin/partners/pending', {
      params: cleanParams({ includeAll: includeAll ? true : undefined }),
    });
    return data;
  },

  async reviewPartner(partnerId: string, payload: ReviewRequest): Promise<PartnerDto> {
    const { data } = await http.post<PartnerDto>(`/admin/partners/${partnerId}/approve`, payload);
    return data;
  },

  async listLocations(status?: LocationStatus): Promise<LocationDetailDto[]> {
    const { data } = await http.get<LocationDetailDto[]>('/admin/locations', {
      params: cleanParams({ status }),
    });
    return data;
  },

  async reviewLocation(locationId: string, payload: ReviewRequest): Promise<LocationDetailDto> {
    const { data } = await http.post<LocationDetailDto>(`/admin/locations/${locationId}/approve`, payload);
    return data;
  },

  async listReservations(filters?: AdminReservationFilters): Promise<ReservationDto[]> {
    const { data } = await http.get<ReservationDto[]>('/admin/reservations', {
      params: cleanParams(filters),
    });
    return data;
  },

  async listIncidents(status?: TicketStatus): Promise<SupportTicketDto[]> {
    const { data } = await http.get<SupportTicketDto[]>('/admin/incidents', {
      params: cleanParams({ status }),
    });
    return data;
  },

  async resolveIncident(ticketId: string, payload: ResolveIncidentRequest): Promise<SupportTicketDto> {
    const { data } = await http.patch<SupportTicketDto>(`/admin/incidents/${ticketId}`, payload);
    return data;
  },
};
