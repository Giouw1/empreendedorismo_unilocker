import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { Roles } from '../common/auth/auth.guard';
import { AdminLocationsQuery, IncidentBody, IncidentsQuery, PartnersQuery, ReservationQuery, ReviewBody, SearchQuery } from '../common/dto/requests.dto';
import { AdminService } from './admin.service';
@Roles('ADMIN') @Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}
  @Get('dashboard') dashboard() { return this.admin.getOverview(); }
  @Get('users') users(@Query() q: SearchQuery) { return this.admin.listUsers(q.search); }
  @Get('partners/pending') partners(@Query() q: PartnersQuery) { return this.admin.listPartners(q.includeAll); }
  @Post('partners/:id/approve') @HttpCode(200) reviewPartner(@Param('id') id: string, @Body() b: ReviewBody) { return this.admin.reviewPartner(id, b.approved); }
  @Get('locations') locations(@Query() q: AdminLocationsQuery) { return this.admin.listAllLocations(q.status); }
  @Post('locations/:id/approve') @HttpCode(200) reviewLocation(@Param('id') id: string, @Body() b: ReviewBody) { return this.admin.reviewLocation(id, b.approved); }
  @Get('reservations') reservations(@Query() q: ReservationQuery) { return this.admin.listAllReservations(q); }
  @Get('incidents') incidents(@Query() q: IncidentsQuery) { return this.admin.listIncidents(q.status); }
  @Patch('incidents/:id') resolve(@Param('id') id: string, @Body() b: IncidentBody) { return this.admin.resolveIncident(id, b); }
}
