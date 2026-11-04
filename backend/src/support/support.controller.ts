import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateTicketRequest, SupportTicketDto } from '../common/contracts/api.contracts';
import { CurrentUser } from '../common/auth/mock-auth.guard';
import { UserRecord } from '../common/mock/mock-db.service';
import { SupportService } from './support.service';

@Controller('support/tickets')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  /** POST /api/support/tickets */
  @Post()
  create(@CurrentUser() user: UserRecord, @Body() dto: CreateTicketRequest): SupportTicketDto {
    return this.supportService.createTicket(user, dto);
  }

  /** GET /api/support/tickets/me */
  @Get('me')
  mine(@CurrentUser() user: UserRecord): SupportTicketDto[] {
    return this.supportService.listMyTickets(user);
  }
}
