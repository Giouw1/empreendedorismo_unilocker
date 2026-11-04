import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AccessModule } from './access/access.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { MockAuthGuard } from './common/auth/mock-auth.guard';
import { CommonModule } from './common/common.module';
import { LocationsModule } from './locations/locations.module';
import { PartnersModule } from './partners/partners.module';
import { ReservationsModule } from './reservations/reservations.module';
import { SupportModule } from './support/support.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    CommonModule,
    AuthModule,
    UsersModule,
    LocationsModule,
    ReservationsModule,
    AccessModule,
    PartnersModule,
    SupportModule,
    AdminModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: MockAuthGuard }],
})
export class AppModule {}
