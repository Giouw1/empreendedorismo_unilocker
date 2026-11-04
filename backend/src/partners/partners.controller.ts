import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  AddLockersRequest,
  CreateLocationRequest,
  LocationDetailDto,
  LockerDto,
  PartnerApplicationRequest,
  PartnerDashboardDto,
  PartnerDto,
  PartnerFinancialSummaryDto,
  ReservationDto,
  ReservationStatus,
  UpdateLocationRequest,
  UpdateLockerStatusRequest,
} from '../common/contracts/api.contracts';
import { CurrentUser, Roles } from '../common/auth/mock-auth.guard';
import { UserRecord } from '../common/mock/mock-db.service';
import { PartnersService } from './partners.service';

@Controller()
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  /** POST /api/partners/applications (qualquer usuário autenticado pode solicitar) */
  @Post('partners/applications')
  apply(@CurrentUser() user: UserRecord, @Body() dto: PartnerApplicationRequest): PartnerDto {
    return this.partnersService.applyForPartner(user, dto);
  }

  /** GET /api/partner/dashboard */
  @Roles('PARTNER')
  @Get('partner/dashboard')
  dashboard(@CurrentUser() user: UserRecord): PartnerDashboardDto {
    return this.partnersService.getDashboard(user);
  }

  /** POST /api/partner/locations */
  @Roles('PARTNER')
  @Post('partner/locations')
  createLocation(
    @CurrentUser() user: UserRecord,
    @Body() dto: CreateLocationRequest,
  ): LocationDetailDto {
    return this.partnersService.createLocation(user, dto);
  }

  /** PATCH /api/partner/locations/:id */
  @Roles('PARTNER')
  @Patch('partner/locations/:id')
  updateLocation(
    @CurrentUser() user: UserRecord,
    @Param('id') id: string,
    @Body() dto: UpdateLocationRequest,
  ): LocationDetailDto {
    return this.partnersService.updateLocation(user, id, dto);
  }

  /** POST /api/partner/locations/:id/lockers */
  @Roles('PARTNER')
  @Post('partner/locations/:id/lockers')
  addLockers(
    @CurrentUser() user: UserRecord,
    @Param('id') id: string,
    @Body() dto: AddLockersRequest,
  ): LockerDto[] {
    return this.partnersService.addLockers(user, id, dto);
  }

  /** PATCH /api/partner/lockers/:id */
  @Roles('PARTNER')
  @Patch('partner/lockers/:id')
  updateLocker(
    @CurrentUser() user: UserRecord,
    @Param('id') id: string,
    @Body() dto: UpdateLockerStatusRequest,
  ): LockerDto {
    return this.partnersService.updateLockerStatus(user, id, dto);
  }

  /** GET /api/partner/reservations?locationId&status */
  @Roles('PARTNER')
  @Get('partner/reservations')
  reservations(
    @CurrentUser() user: UserRecord,
    @Query('locationId') locationId?: string,
    @Query('status') status?: ReservationStatus,
  ): ReservationDto[] {
    return this.partnersService.listPartnerReservations(user, {
      locationId: locationId || undefined,
      status: status || undefined,
    });
  }

  /** GET /api/partner/financial */
  @Roles('PARTNER')
  @Get('partner/financial')
  financial(@CurrentUser() user: UserRecord): PartnerFinancialSummaryDto {
    return this.partnersService.getFinancialSummary(user);
  }
}
