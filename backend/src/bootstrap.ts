import 'reflect-metadata';
import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ErrorsFilter } from './common/errors.filter';

export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.enableCors({ origin: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(s => s.trim()), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, forbidUnknownValues: true }));
  app.useGlobalFilters(new ErrorsFilter());
  app.enableShutdownHooks();
  return app;
}
export async function createApp(logger: false | undefined = undefined) { return configureApp(await NestFactory.create(AppModule, { logger })); }
