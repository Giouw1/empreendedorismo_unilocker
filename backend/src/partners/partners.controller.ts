import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UserDto } from '../common/contracts/api.contracts';
import { CurrentUser, Roles } from '../common/auth/auth.guard';
import { AddLockersBody, ApplicationBody, CreateLocationBody, LockerStatusBody, PartnerReservationQuery, UpdateLocationBody } from '../common/dto/requests.dto';
import { PartnersService } from './partners.service';
@Controller()
export class PartnersController {
  constructor(private readonly partners: PartnersService) {}
  @Post('partners/applications') apply(@CurrentUser() u: UserDto, @Body() b: ApplicationBody) { return this.partners.applyForPartner(u, b); }
  @Roles('PARTNER') @Get('partner/dashboard') dashboard(@CurrentUser() u: UserDto) { return this.partners.getDashboard(u); }
  @Roles('PARTNER') @Post('partner/locations') create(@CurrentUser() u: UserDto, @Body() b: CreateLocationBody) { return this.partners.createLocation(u, b); }
  @Roles('PARTNER') @Patch('partner/locations/:id') update(@CurrentUser() u: UserDto, @Param('id') id: string, @Body() b: UpdateLocationBody) { return this.partners.updateLocation(u, id, b); }
  @Roles('PARTNER') @Post('partner/locations/:id/lockers') add(@CurrentUser() u: UserDto, @Param('id') id: string, @Body() b: AddLockersBody) { return this.partners.addLockers(u, id, b); }
  @Roles('PARTNER') @Patch('partner/lockers/:id') locker(@CurrentUser() u: UserDto, @Param('id') id: string, @Body() b: LockerStatusBody) { return this.partners.updateLockerStatus(u, id, b); }
  @Roles('PARTNER') @Get('partner/reservations') reservations(@CurrentUser() u: UserDto, @Query() q: PartnerReservationQuery) { return this.partners.listPartnerReservations(u, q); }
  @Roles('PARTNER') @Get('partner/financial') financial(@CurrentUser() u: UserDto) { return this.partners.getFinancialSummary(u); }
}
