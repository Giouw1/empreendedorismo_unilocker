import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  LocationDetailDto,
  LocationSummaryDto,
  LockerAvailabilityDto,
  LockerDto,
  LockerSize,
  RentalPeriod,
} from '../common/contracts/api.contracts';
import { Public } from '../common/auth/mock-auth.guard';
import { LocationsService } from './locations.service';

@Controller()
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  /** GET /api/locations?campus&search&size&period&maxPriceCents&onlyAvailable */
  @Public()
  @Get('locations')
  list(
    @Query('campus') campus?: string,
    @Query('search') search?: string,
    @Query('size') size?: LockerSize,
    @Query('period') period?: RentalPeriod,
    @Query('maxPriceCents') maxPriceCents?: string,
    @Query('onlyAvailable') onlyAvailable?: string,
  ): LocationSummaryDto[] {
    return this.locationsService.findPublicLocations({
      campus: campus || undefined,
      search: search || undefined,
      size: size || undefined,
      period: period || undefined,
      maxPriceCents: maxPriceCents ? Number(maxPriceCents) : undefined,
      onlyAvailable: onlyAvailable === 'true',
    });
  }

  /** GET /api/locations/:id */
  @Public()
  @Get('locations/:id')
  detail(@Param('id') id: string): LocationDetailDto {
    return this.locationsService.findPublicLocationById(id);
  }

  /** GET /api/locations/:id/lockers */
  @Public()
  @Get('locations/:id/lockers')
  lockers(@Param('id') id: string): LockerDto[] {
    return this.locationsService.listLocationLockers(id);
  }

  /** GET /api/lockers/:id/availability?period */
  @Public()
  @Get('lockers/:id/availability')
  availability(@Param('id') id: string, @Query('period') period?: RentalPeriod): LockerAvailabilityDto {
    return this.locationsService.checkLockerAvailability(id, period || 'DAILY');
  }
}
