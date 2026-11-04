import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthResponseDto, LoginRequest, RegisterRequest } from '../common/contracts/api.contracts';
import { issueMockToken } from '../common/auth/mock-auth.guard';
import { MockDbService } from '../common/mock/mock-db.service';

@Injectable()
export class AuthService {
  constructor(private readonly db: MockDbService) {}

  /**
   * Cria uma conta com perfil `['USER']` e retorna a sessão.
   *
   * TODO [PLANO-BACKEND]:
   * - Validar DTO com class-validator (e-mail válido, senha >= 6 caracteres).
   * - Persistir no SQLite via Prisma com `passwordHash = bcrypt.hash(password)`.
   * - Emitir JWT assinado com `{ sub: user.id, roles }`.
   */
  register(dto: RegisterRequest): AuthResponseDto {
    if (!dto?.name || !dto?.email || !dto?.password || !dto?.universityAffiliation) {
      throw new BadRequestException('Preencha nome, e-mail, senha e vínculo universitário.');
    }
    if (this.db.findUserByEmail(dto.email)) {
      throw new ConflictException('Já existe uma conta com este e-mail.');
    }
    const user = {
      id: this.db.nextId('u'),
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      password: dto.password,
      universityAffiliation: dto.universityAffiliation.trim(),
      roles: ['USER' as const],
      createdAt: this.db.now(),
    };
    this.db.users.push(user);
    return { accessToken: issueMockToken(user.id), user: this.db.toUserDto(user) };
  }

  /**
   * Valida credenciais e emite token.
   *
   * TODO [PLANO-BACKEND]: comparar com `bcrypt.compare` e emitir JWT real.
   */
  login(dto: LoginRequest): AuthResponseDto {
    const user = dto?.email ? this.db.findUserByEmail(dto.email) : undefined;
    if (!user || user.password !== dto.password) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }
    return { accessToken: issueMockToken(user.id), user: this.db.toUserDto(user) };
  }
}
