import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthResponseDto, LoginRequest, RegisterRequest } from '../common/contracts/api.contracts';
import { Public } from '../common/auth/mock-auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** POST /api/auth/register */
  @Public()
  @Post('register')
  register(@Body() dto: RegisterRequest): AuthResponseDto {
    return this.authService.register(dto);
  }

  /** POST /api/auth/login */
  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginRequest): AuthResponseDto {
    return this.authService.login(dto);
  }
}
