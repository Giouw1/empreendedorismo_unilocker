import { Global, Module } from '@nestjs/common';
import { MockDbService } from './mock/mock-db.service';

/** Disponibiliza o MockDbService (singleton) para todos os módulos. */
@Global()
@Module({
  providers: [MockDbService],
  exports: [MockDbService],
})
export class CommonModule {}
