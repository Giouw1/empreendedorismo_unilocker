import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { AccessEventDto } from '../common/contracts/api.contracts';
import { CurrentUser } from '../common/auth/mock-auth.guard';
import { UserRecord } from '../common/mock/mock-db.service';
import { AccessService } from './access.service';

@Controller('reservations/:id')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  /** POST /api/reservations/:id/unlock */
  @Post('unlock')
  @HttpCode(200)
  unlock(@CurrentUser() user: UserRecord, @Param('id') reservationId: string): AccessEventDto {
    return this.accessService.requestUnlock(user, reservationId);
  }

  /** GET /api/reservations/:id/access-events */
  @Get('access-events')
  listEvents(@CurrentUser() user: UserRecord, @Param('id') reservationId: string): AccessEventDto[] {
    return this.accessService.listAccessEvents(user, reservationId);
  }
}
