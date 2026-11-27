/**
 * Prepara o backend num clone novo: `npm run setup`.
 * 1. Cria backend/.env a partir de .env.example (com uma chave JWT aleatória), se ainda não existir.
 * 2. Aplica as migrações no SQLite (cria o banco se preciso).
 * 3. Carrega os dados de demonstração (seed idempotente: pode rodar de novo sem duplicar).
 */
const { randomBytes } = require('node:crypto');
const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const root = join(__dirname, '..');
const envPath = join(root, '.env');
const examplePath = join(root, '.env.example');

if (existsSync(envPath)) {
  console.log('• backend/.env já existe: mantido como está.');
} else {
  const secret = randomBytes(32).toString('hex');
  const env = readFileSync(examplePath, 'utf8').replace(/^JWT_SECRET=.*$/m, `JWT_SECRET="${secret}"`);
  writeFileSync(envPath, env);
  console.log('• backend/.env criado a partir de .env.example (chave JWT gerada).');
}

function run(label, args) {
  console.log(`• ${label}...`);
  const result = spawnSync('npx', ['prisma', ...args], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    console.error(`\n✖ Falhou: ${label}. Se o backend estiver rodando, pare-o (Ctrl+C) e rode "npm run setup" de novo.`);
    process.exit(result.status ?? 1);
  }
}

run('Gerando o cliente do Prisma', ['generate']);
run('Aplicando as migrações do banco', ['migrate', 'deploy']);
run('Carregando os dados de demonstração', ['db', 'seed']);

console.log('\n✔ Backend pronto. Rode "npm run start:dev" e acesse http://localhost:3000/api');
