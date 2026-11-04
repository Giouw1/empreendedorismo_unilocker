import { createApp } from './bootstrap';

async function bootstrap() {
  const app = await createApp();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`🔐 UniLocker API rodando em http://localhost:${port}/api`);
}

bootstrap().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
