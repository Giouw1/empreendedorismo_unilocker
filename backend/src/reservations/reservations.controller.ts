import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  CompleteReservationRequest,
  CreateReservationRequest,
  ExtendReservationRequest,
  MyReservationsResponse,
  ReservationDto,
} from '../common/contracts/api.contracts';
import { CurrentUser } from '../common/auth/mock-auth.guard';
import { UserRecord } from '../common/mock/mock-db.service';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  /** POST /api/reservations */
  @Post()
  create(@CurrentUser() user: UserRecord, @Body() dto: CreateReservationRequest): ReservationDto {
    return this.reservationsService.createReservation(user, dto);
  }

  /** GET /api/reservations/me — declarado antes de `:id` para não colidir. */
  @Get('me')
  mine(@CurrentUser() user: UserRecord): MyReservationsResponse {
    return this.reservationsService.listUserReservations(user);
  }

  /** GET /api/reservations/:id */
  @Get(':id')
  detail(@CurrentUser() user: UserRecord, @Param('id') id: string): ReservationDto {
    return this.reservationsService.getReservationById(user, id);
  }

  /** POST /api/reservations/:id/extend */
  @Post(':id/extend')
  @HttpCode(200)
  extend(
    @CurrentUser() user: UserRecord,
    @Param('id') id: string,
    @Body() dto: ExtendReservationRequest,
  ): ReservationDto {
    return this.reservationsService.extendReservation(user, id, dto);
  }

  /** POST /api/reservations/:id/complete */
  @Post(':id/complete')
  @HttpCode(200)
  complete(
    @CurrentUser() user: UserRecord,
    @Param('id') id: string,
    @Body() dto: CompleteReservationRequest,
  ): ReservationDto {
    return this.reservationsService.completeReservation(user, id, dto);
  }

  /** POST /api/reservations/:id/cancel */
  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@CurrentUser() user: UserRecord, @Param('id') id: string): ReservationDto {
    return this.reservationsService.cancelPendingReservation(user, id);
  }
}
