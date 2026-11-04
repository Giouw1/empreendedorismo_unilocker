import { Controller, Get, Param, Query } from '@nestjs/common';
import { UserDto } from '../common/contracts/api.contracts';
import { CurrentUser, Public } from '../common/auth/auth.guard';
import { AvailabilityQuery, LocationQuery } from '../common/dto/requests.dto';
import { LocationsService } from './locations.service';
@Public() @Controller()
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}
  @Get('locations') list(@Query() query: LocationQuery) { return this.locations.findPublicLocations(query); }
  @Get('locations/:id') detail(@Param('id') id: string, @CurrentUser() user?: UserDto) { return this.locations.findPublicLocationById(id, user); }
  @Get('locations/:id/lockers') lockers(@Param('id') id: string, @CurrentUser() user?: UserDto) { return this.locations.listLocationLockers(id, user); }
  @Get('lockers/:id/availability') availability(@Param('id') id: string, @Query() query: AvailabilityQuery) { return this.locations.checkLockerAvailability(id, query.period); }
}
