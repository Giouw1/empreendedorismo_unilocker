import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { UserDto } from '../common/contracts/api.contracts';
import { CurrentUser } from '../common/auth/auth.guard';
import { CompleteBody, ExtendBody, ReservationBody } from '../common/dto/requests.dto';
import { ReservationsService } from './reservations.service';
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}
  @Post() create(@CurrentUser() user: UserDto, @Body() dto: ReservationBody) { return this.reservations.createReservation(user, dto); }
  @Get('me') mine(@CurrentUser() user: UserDto) { return this.reservations.listUserReservations(user); }
  @Get(':id') detail(@CurrentUser() user: UserDto, @Param('id') id: string) { return this.reservations.getReservationById(user, id); }
  @Post(':id/extend') @HttpCode(200) extend(@CurrentUser() user: UserDto, @Param('id') id: string, @Body() dto: ExtendBody) { return this.reservations.extendReservation(user, id, dto); }
  @Post(':id/complete') @HttpCode(200) complete(@CurrentUser() user: UserDto, @Param('id') id: string, @Body() dto: CompleteBody) { return this.reservations.completeReservation(user, id, dto); }
  @Post(':id/cancel') @HttpCode(200) cancel(@CurrentUser() user: UserDto, @Param('id') id: string) { return this.reservations.cancelPendingReservation(user, id); }
}
