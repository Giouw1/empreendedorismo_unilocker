import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import {
  AdminDashboardDto,
  LocationDetailDto,
  LocationStatus,
  PartnerDto,
  ReservationDto,
  ReservationStatus,
  ResolveIncidentRequest,
  ReviewRequest,
  SupportTicketDto,
  TicketStatus,
  UserDto,
} from '../common/contracts/api.contracts';
import { Roles } from '../common/auth/mock-auth.guard';
import { AdminService } from './admin.service';

@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** GET /api/admin/dashboard */
  @Get('dashboard')
  dashboard(): AdminDashboardDto {
    return this.adminService.getOverview();
  }

  /** GET /api/admin/users?search */
  @Get('users')
  users(@Query('search') search?: string): UserDto[] {
    return this.adminService.listUsers(search);
  }

  /** GET /api/admin/partners/pending?includeAll */
  @Get('partners/pending')
  partners(@Query('includeAll') includeAll?: string): PartnerDto[] {
    return this.adminService.listPartners(includeAll === 'true');
  }

  /** POST /api/admin/partners/:id/approve */
  @Post('partners/:id/approve')
  @HttpCode(200)
  reviewPartner(@Param('id') id: string, @Body() dto: ReviewRequest): PartnerDto {
    return this.adminService.reviewPartner(id, !!dto?.approved);
  }

  /** GET /api/admin/locations?status */
  @Get('locations')
  locations(@Query('status') status?: LocationStatus): LocationDetailDto[] {
    return this.adminService.listAllLocations(status || undefined);
  }

  /** POST /api/admin/locations/:id/approve */
  @Post('locations/:id/approve')
  @HttpCode(200)
  reviewLocation(@Param('id') id: string, @Body() dto: ReviewRequest): LocationDetailDto {
    return this.adminService.reviewLocation(id, !!dto?.approved);
  }

  /** GET /api/admin/reservations?status&locationId&userId */
  @Get('reservations')
  reservations(
    @Query('status') status?: ReservationStatus,
    @Query('locationId') locationId?: string,
    @Query('userId') userId?: string,
  ): ReservationDto[] {
    return this.adminService.listAllReservations({
      status: status || undefined,
      locationId: locationId || undefined,
      userId: userId || undefined,
    });
  }

  /** GET /api/admin/incidents?status */
  @Get('incidents')
  incidents(@Query('status') status?: TicketStatus): SupportTicketDto[] {
    return this.adminService.listIncidents(status || undefined);
  }

  /** PATCH /api/admin/incidents/:id */
  @Patch('incidents/:id')
  resolveIncident(
    @Param('id') id: string,
    @Body() dto: ResolveIncidentRequest,
  ): SupportTicketDto {
    return this.adminService.resolveIncident(id, dto);
  }
}
