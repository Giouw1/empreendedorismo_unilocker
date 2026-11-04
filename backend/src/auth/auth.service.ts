import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { AuthResponseDto, LoginRequest, RegisterRequest } from '../common/contracts/api.contracts';
import { PrismaService } from '../common/prisma/prisma.service';
import { userDto } from '../common/mappers';
@Injectable()
export class AuthService {
  constructor(private readonly db: PrismaService, private readonly jwt: JwtService) {}
  private async session(id: string): Promise<AuthResponseDto> {
    const record = await this.db.user.findUniqueOrThrow({ where: { id }, include: { partner: true } });
    const user = userDto(record);
    return { accessToken: await this.jwt.signAsync({ sub: id, roles: user.roles }), user };
  }
  async register(dto: RegisterRequest): Promise<AuthResponseDto> {
    if (await this.db.user.findUnique({ where: { email: dto.email } })) throw new ConflictException('Já existe uma conta com este e-mail.');
    const { password, ...data } = dto;
    const user = await this.db.user.create({ data: { ...data, passwordHash: await hash(password, 10), rolesJson: '["USER"]' } });
    return this.session(user.id);
  }
  async login(dto: LoginRequest): Promise<AuthResponseDto> {
    const user = await this.db.user.findUnique({ where: { email: dto.email } });
    const digest = user?.passwordHash ?? '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    if (!await compare(dto.password, digest) || !user) throw new UnauthorizedException('E-mail ou senha inválidos.');
    return this.session(user.id);
  }
}
