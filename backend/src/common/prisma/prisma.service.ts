import { ConflictException, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    await this.$queryRawUnsafe('PRAGMA journal_mode=WAL');
    await this.$queryRawUnsafe('PRAGMA busy_timeout=5000');
  }
  async onModuleDestroy() { await this.$disconnect(); }
  // SQLite serializa escritores. Retry bounded para disputas entre transações/processos.
  async atomic<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 10000 });
      } catch (error) {
        const code = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : '';
        if (['P2034', 'P1008', 'P2028'].includes(code)) {
          if (attempt >= 3) throw new ConflictException('Recurso disputado por outra operação. Tente novamente.');
          await new Promise(resolve => setTimeout(resolve, 20 * (attempt + 1)));
          continue;
        }
        throw error;
      }
    }
  }
}
