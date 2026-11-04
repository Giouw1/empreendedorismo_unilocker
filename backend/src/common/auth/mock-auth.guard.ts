import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../contracts/api.contracts';
import { MockDbService, UserRecord } from '../mock/mock-db.service';

/**
 * ============================================================================
 * Autenticação MOCK do Plano 1.
 * ============================================================================
 * O token emitido é opaco no formato `mock-token-<userId>`. O guard global
 * resolve o usuário a partir do header `Authorization: Bearer <token>`.
 *
 * TODO [PLANO-BACKEND]: substituir por JWT (`@nestjs/jwt` + `passport-jwt`),
 * mantendo os mesmos decorators `@Public()`, `@Roles()` e `@CurrentUser()`
 * para que os controllers não precisem mudar.
 * ============================================================================
 */

export const MOCK_TOKEN_PREFIX = 'mock-token-';
export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/** Marca uma rota como pública (dispensa token). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Exige que o usuário possua ao menos um dos perfis informados. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/** Injeta o usuário autenticado (`UserRecord`) no handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserRecord => ctx.switchToHttp().getRequest().user,
);

export function issueMockToken(userId: string): string {
  return `${MOCK_TOKEN_PREFIX}${userId}`;
}

@Injectable()
export class MockAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly db: MockDbService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets);
    const request = context.switchToHttp().getRequest();

    const header: string | undefined = request.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined;
    const user =
      token && token.startsWith(MOCK_TOKEN_PREFIX)
        ? this.db.findUserById(token.slice(MOCK_TOKEN_PREFIX.length))
        : undefined;

    if (user) request.user = user;
    if (isPublic) return true;
    if (!user) throw new UnauthorizedException('Sessão inválida ou expirada. Faça login novamente.');

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, targets);
    if (requiredRoles?.length && !requiredRoles.some((role) => user.roles.includes(role))) {
      throw new ForbiddenException('Seu perfil não tem permissão para esta ação.');
    }
    return true;
  }
}
