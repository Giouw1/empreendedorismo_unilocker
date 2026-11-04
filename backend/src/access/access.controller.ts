import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { UserDto } from '../common/contracts/api.contracts';
import { CurrentUser } from '../common/auth/auth.guard';
import { AccessService } from './access.service';
@Controller('reservations/:id')
export class AccessController {
  constructor(private readonly access: AccessService) {}
  @Post('unlock') @HttpCode(200) unlock(@CurrentUser() user: UserDto, @Param('id') id: string) { return this.access.requestUnlock(user, id); }
  @Get('access-events') events(@CurrentUser() user: UserDto, @Param('id') id: string) { return this.access.listAccessEvents(user, id); }
}
