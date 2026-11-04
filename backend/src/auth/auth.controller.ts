import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Public } from '../common/auth/auth.guard';
import { LoginBody, RegisterBody } from '../common/dto/requests.dto';
import { AuthService } from './auth.service';
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Public() @Post('register') register(@Body() dto: RegisterBody) { return this.auth.register(dto); }
  @Public() @Post('login') @HttpCode(200) login(@Body() dto: LoginBody) { return this.auth.login(dto); }
}
