import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserDto, UserRole } from '../contracts/api.contracts';
import { PrismaService } from '../prisma/prisma.service';
import { userDto } from '../mappers';

export const Public = () => SetMetadata('isPublic', true);
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): UserDto => ctx.switchToHttp().getRequest().user);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly jwt: JwtService, private readonly db: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    const targets = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', targets);
    const request = context.switchToHttp().getRequest();
    const token = /^Bearer (\S+)$/.exec(request.headers.authorization ?? '')?.[1];
    let user: UserDto | undefined;
    if (token) {
      try {
        const payload = await this.jwt.verifyAsync<{ sub: string }>(token, { algorithms: ['HS256'] });
        if (typeof payload.sub === 'string') {
          const record = await this.db.user.findUnique({ where: { id: payload.sub }, include: { partner: true } });
          if (record) user = userDto(record);
        }
      } catch { /* Token inválido não autentica; rotas públicas continuam públicas. */ }
    }
    request.user = user;
    if (isPublic) return true;
    if (!user) throw new UnauthorizedException('Sessão inválida ou expirada. Faça login novamente.');
    const required = this.reflector.getAllAndOverride<UserRole[]>('roles', targets);
    if (required?.length && !required.some(role => user.roles.includes(role))) throw new ForbiddenException('Seu perfil não tem permissão para esta ação.');
    return true;
  }
}
