import { Global, Module } from '@nestjs/common';
import 'dotenv/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma/prisma.service';
import { Store } from './store.service';
import { Clock } from './domain';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) throw new Error('Configure JWT_SECRET com ao menos 32 caracteres no backend/.env.');

@Global()
@Module({
  imports: [JwtModule.register({ global: true, secret: jwtSecret, signOptions: { algorithm: 'HS256', expiresIn: '7d', issuer: 'unilocker', audience: 'unilocker-app' }, verifyOptions: { issuer: 'unilocker', audience: 'unilocker-app' } })],
  providers: [PrismaService, Store, Clock],
  exports: [PrismaService, Store, Clock, JwtModule],
})
export class CommonModule {}
