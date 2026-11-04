import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UserDto } from '../common/contracts/api.contracts';
import { CurrentUser } from '../common/auth/auth.guard';
import { ProfileBody } from '../common/dto/requests.dto';
import { UsersService } from './users.service';
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get('me') me(@CurrentUser() user: UserDto) { return this.users.getProfile(user); }
  @Patch('me') update(@CurrentUser() user: UserDto, @Body() dto: ProfileBody) { return this.users.updateProfile(user, dto); }
}
