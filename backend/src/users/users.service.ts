import { Injectable } from '@nestjs/common';
import { UpdateProfileRequest, UserDto } from '../common/contracts/api.contracts';
import { PrismaService } from '../common/prisma/prisma.service';
import { userDto } from '../common/mappers';
@Injectable()
export class UsersService {
  constructor(private readonly db: PrismaService) {}
  getProfile(user: UserDto): UserDto { return user; }
  async updateProfile(user: UserDto, dto: UpdateProfileRequest): Promise<UserDto> {
    return userDto(await this.db.user.update({ where: { id: user.id }, data: dto, include: { partner: true } }));
  }
}
