import { Injectable } from '@nestjs/common';
import { UpdateProfileRequest, UserDto } from '../common/contracts/api.contracts';
import { MockDbService, UserRecord } from '../common/mock/mock-db.service';

@Injectable()
export class UsersService {
  constructor(private readonly db: MockDbService) {}

  /**
   * Retorna o perfil do usuário logado com vínculo de parceiro (se houver).
   *
   * TODO [PLANO-BACKEND]: `prisma.user.findUnique({ include: { partner: true } })`.
   */
  getProfile(user: UserRecord): UserDto {
    return this.db.toUserDto(user);
  }

  /**
   * Atualiza nome e vínculo universitário.
   *
   * TODO [PLANO-BACKEND]: validar campos (não vazios, tamanho máximo) e persistir via Prisma.
   */
  updateProfile(user: UserRecord, dto: UpdateProfileRequest): UserDto {
    if (dto?.name?.trim()) user.name = dto.name.trim();
    if (dto?.universityAffiliation?.trim()) user.universityAffiliation = dto.universityAffiliation.trim();
    return this.db.toUserDto(user);
  }
}
