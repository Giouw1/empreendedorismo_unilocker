import { cleanParams, http } from './http';
import type {
  AddLockersRequest,
  CreateLocationRequest,
  LocationDetailDto,
  LockerDto,
  PartnerApplicationRequest,
  PartnerDashboardDto,
  PartnerDto,
  PartnerFinancialSummaryDto,
  PartnerReservationFilters,
  ReservationDto,
  UpdateLocationRequest,
  UpdateLockerStatusRequest,
} from '../types/api';

export const partnerService = {
  async apply(payload: PartnerApplicationRequest): Promise<PartnerDto> {
    const { data } = await http.post<PartnerDto>('/partners/applications', payload);
    return data;
  },

  async getDashboard(): Promise<PartnerDashboardDto> {
    const { data } = await http.get<PartnerDashboardDto>('/partner/dashboard');
    return data;
  },

  async createLocation(payload: CreateLocationRequest): Promise<LocationDetailDto> {
    const { data } = await http.post<LocationDetailDto>('/partner/locations', payload);
    return data;
  },

  async updateLocation(locationId: string, payload: UpdateLocationRequest): Promise<LocationDetailDto> {
    const { data } = await http.patch<LocationDetailDto>(`/partner/locations/${locationId}`, payload);
    return data;
  },

  async addLockers(locationId: string, payload: AddLockersRequest): Promise<LockerDto[]> {
    const { data } = await http.post<LockerDto[]>(`/partner/locations/${locationId}/lockers`, payload);
    return data;
  },

  async updateLockerStatus(lockerId: string, payload: UpdateLockerStatusRequest): Promise<LockerDto> {
    const { data } = await http.patch<LockerDto>(`/partner/lockers/${lockerId}`, payload);
    return data;
  },

  async listReservations(filters?: PartnerReservationFilters): Promise<ReservationDto[]> {
    const { data } = await http.get<ReservationDto[]>('/partner/reservations', {
      params: cleanParams(filters),
    });
    return data;
  },

  async getFinancial(): Promise<PartnerFinancialSummaryDto> {
    const { data } = await http.get<PartnerFinancialSummaryDto>('/partner/financial');
    return data;
  },
};
