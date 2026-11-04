import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { closeSync, existsSync, mkdirSync, openSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';

const url = process.env.DATABASE_URL ?? 'file:./dev.db';
// Prisma 6/Windows pode falhar na primeira conexão se o arquivo ainda não existir.
// Criar somente o arquivo vazio permite `prisma migrate dev` em um clone limpo.
if (url.startsWith('file:') && url !== 'file::memory:') {
  const value = url.slice(5);
  const path = isAbsolute(value) ? value : resolve(__dirname, 'prisma', value);
  mkdirSync(dirname(path), { recursive: true });
  if (!existsSync(path)) closeSync(openSync(path, 'wx'));
}
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'ts-node prisma/seed.ts' },
  datasource: { url },
});
