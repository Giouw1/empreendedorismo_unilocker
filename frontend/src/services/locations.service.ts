import { cleanParams, http } from './http';
import type {
  LocationDetailDto,
  LocationFilters,
  LocationSummaryDto,
  LockerAvailabilityDto,
  LockerDto,
  RentalPeriod,
} from '../types/api';

export const locationsService = {
  async list(filters?: LocationFilters): Promise<LocationSummaryDto[]> {
    const { data } = await http.get<LocationSummaryDto[]>('/locations', {
      params: cleanParams(filters),
    });
    return data;
  },

  async getById(id: string): Promise<LocationDetailDto> {
    const { data } = await http.get<LocationDetailDto>(`/locations/${id}`);
    return data;
  },

  async listLockers(locationId: string): Promise<LockerDto[]> {
    const { data } = await http.get<LockerDto[]>(`/locations/${locationId}/lockers`);
    return data;
  },

  async checkLockerAvailability(lockerId: string, period?: RentalPeriod): Promise<LockerAvailabilityDto> {
    const { data } = await http.get<LockerAvailabilityDto>(`/lockers/${lockerId}/availability`, {
      params: cleanParams({ period }),
    });
    return data;
  },
};
