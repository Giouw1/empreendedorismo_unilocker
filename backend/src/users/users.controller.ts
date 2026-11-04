import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UpdateProfileRequest, UserDto } from '../common/contracts/api.contracts';
import { CurrentUser } from '../common/auth/mock-auth.guard';
import { UserRecord } from '../common/mock/mock-db.service';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /api/users/me */
  @Get('me')
  me(@CurrentUser() user: UserRecord): UserDto {
    return this.usersService.getProfile(user);
  }

  /** PATCH /api/users/me */
  @Patch('me')
  update(@CurrentUser() user: UserRecord, @Body() dto: UpdateProfileRequest): UserDto {
    return this.usersService.updateProfile(user, dto);
  }
}
