import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserDto } from '../common/contracts/api.contracts';
import { CurrentUser } from '../common/auth/auth.guard';
import { TicketBody } from '../common/dto/requests.dto';
import { SupportService } from './support.service';
@Controller('support/tickets')
export class SupportController {
  constructor(private readonly support: SupportService) {}
  @Post() create(@CurrentUser() user: UserDto, @Body() dto: TicketBody) { return this.support.createTicket(user, dto); }
  @Get('me') mine(@CurrentUser() user: UserDto) { return this.support.listMyTickets(user); }
}
