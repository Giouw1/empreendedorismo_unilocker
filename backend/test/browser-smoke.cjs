/* Teste real do frontend intacto em :5173 contra o backend em :3000.
 * Usa banco isolado e encerra os processos que iniciou, inclusive em falhas. */
const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const { existsSync, mkdirSync, mkdtempSync, writeFileSync } = require('node:fs');
const { resolve, join } = require('node:path');
const { chromium } = require('playwright');

const backend = resolve(__dirname, '..');
const frontend = resolve(backend, '../frontend');
mkdirSync(join(backend, 'test-results'), { recursive: true });
const directory = mkdtempSync(join(backend, 'test-results/browser-'));
const env = { ...process.env, DATABASE_URL: `file:${join(directory, 'browser.db').replaceAll('\\', '/')}`, PORT: '3000' };
const servers = [];
const logs = [];
const report = { checks: [], apiErrors: [], pageErrors: [], corsOrigins: [], screenshots: [] };
let browser;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function ready(url) {
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(url)).ok) return; } catch {}
    await delay(250);
  }
  throw new Error(`Servidor não iniciou: ${url}\n${logs.join('')}`);
}
function start(args, cwd) {
  const child = spawn(process.execPath, args, { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', data => logs.push(data.toString()));
  child.stderr.on('data', data => logs.push(data.toString()));
  servers.push(child);
}
async function checkPort(url) {
  try { await fetch(url); } catch { return; }
  throw new Error(`Porta já está em uso (${url}). Encerre seu servidor antes de executar o smoke test isolado.`);
}
async function screenshot(page, name) {
  const path = join(directory, `${name}.png`);
  await page.screenshot({ path, fullPage: true }); report.screenshots.push(path);
}
async function main() {
  await checkPort('http://localhost:3000/api/locations');
  await checkPort('http://localhost:5173');
  execFileSync(process.execPath, [resolve(backend, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy'], { cwd: backend, env, stdio: 'pipe' });
  execFileSync(process.execPath, ['-r', 'ts-node/register', 'prisma/seed.ts'], { cwd: backend, env, stdio: 'pipe' });
  start(['dist/main.js'], backend);
  start([resolve(frontend, 'node_modules/vite/bin/vite.js'), '--host', 'localhost', '--port', '5173', '--strictPort'], frontend);
  await Promise.all([ready('http://localhost:3000/api/locations'), ready('http://localhost:5173')]);
  const executablePath = process.env.CHROME_PATH ?? [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].find(existsSync);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const page = await browser.newPage({ viewport: { width: 1366, height: 960 } });
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => report.pageErrors.push(error.message));
  page.on('requestfailed', req => { if (req.url().startsWith('http://localhost:3000/')) report.apiErrors.push({ url: req.url(), error: req.failure()?.errorText }); });
  page.on('response', response => {
    if (!response.url().startsWith('http://localhost:3000/')) return;
    if (response.status() >= 400) report.apiErrors.push({ url: response.url(), status: response.status() });
    const origin = response.headers()['access-control-allow-origin'];
    if (origin && !report.corsOrigins.includes(origin)) report.corsOrigins.push(origin);
  });
  const go = path => page.goto(`http://localhost:5173${path}`);
  const persona = async (label, path) => {
    await go('/login');
    await page.getByRole('button', { name: new RegExp(`^${label}`) }).click();
    await page.waitForURL(`**${path}`);
  };

  await go('/login');
  await page.getByRole('button', { name: /^Cintra/ }).click();
  await page.waitForURL('**/app/explore');
  await page.getByRole('heading', { name: 'Explorar lockers' }).waitFor();
  await page.getByText('Laboratório de Artes Modernas — EBA', { exact: true }).waitFor();
  await screenshot(page, '01-cintra-explore');
  await go('/app/reservations/res-cintra-active');
  await page.getByRole('heading', { name: 'Acesso ao Compartimento Físico' }).waitFor();
  report.checks.push('Login Cintra, catálogo e reserva ativa do CT');

  await persona('Joaquim', '/app/explore');
  await go('/app/locations/loc-eba');
  await page.getByRole('button', { name: /^Reservar por/ }).click();
  await page.getByRole('button', { name: 'Confirmar Reserva' }).click();
  await page.waitForURL(/\/app\/reservations\/[\w-]+$/);
  await page.getByRole('heading', { name: 'Acesso ao Compartimento Físico' }).waitFor();
  await screenshot(page, '02-joaquim-reserved');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Encerrar e liberar compartimento' }).click();
  await page.getByText('Finalizada').waitFor();
  report.checks.push('Persona Joaquim: checkout, reserva Active e encerramento');

  await persona('Prof. Guilherme', '/partner/dashboard');
  await page.getByRole('heading', { name: 'Laboratório de Artes Modernas — EBA', exact: true }).first().waitFor();
  await page.getByRole('button', { name: 'Sair' }).waitFor();
  await go('/partner/financial');
  await page.getByRole('heading', { name: 'Demonstrativo de receitas' }).waitFor();
  await page.getByText('Líquido Parceiro (90%)', { exact: true }).waitFor();
  await screenshot(page, '03-guilherme-financial');
  await go('/partner/locations/loc-eba/lockers');
  await page.getByRole('heading', { name: 'Gerenciar compartimentos' }).waitFor();
  await page.getByText('A-01', { exact: true }).waitFor();
  await go('/partner/reservations');
  await page.locator('tbody tr').first().waitFor();
  report.checks.push('Persona Guilherme: painel, lockers, reservas e financeiro 90/10');

  await persona('Admin', '/admin/dashboard');
  await page.getByRole('heading', { name: 'Painel Administrativo — Operação UFRJ' }).waitFor();
  await screenshot(page, '04-admin-dashboard');
  await go('/admin/partners');
  const cantina = page.getByRole('row').filter({ hasText: 'Cantina do CCMN' });
  await cantina.getByRole('button', { name: 'Aprovar', exact: true }).click();
  await cantina.getByRole('button', { name: 'Aprovar', exact: true }).waitFor({ state: 'detached' });
  await go('/admin/locations');
  const letras = page.getByRole('row').filter({ hasText: 'Centro Acadêmico — Letras' });
  await letras.getByRole('button', { name: 'Publicar', exact: true }).click();
  await letras.getByRole('button', { name: 'Publicar', exact: true }).waitFor({ state: 'detached' });
  await go('/admin/users'); await page.locator('tbody tr').first().waitFor();
  await go('/admin/reservations'); await page.locator('tbody tr').first().waitFor();
  await go('/admin/incidents');
  await page.getByRole('heading', { name: 'Central de ocorrências e suporte' }).waitFor();
  await page.getByText(/Posso guardar meu notebook/).waitFor();
  report.checks.push('Persona Admin: indicadores, usuários, aprovar parceiro/ponto, reservas e suporte');
  assert.deepEqual(report.apiErrors, []);
  assert.deepEqual(report.pageErrors, []);
  assert.ok(report.corsOrigins.includes('http://localhost:5173'));
  console.log(JSON.stringify({ ...report, artifacts: directory }, null, 2));
}
main().catch(error => { report.failure = error.stack; console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  for (const child of servers) child.kill();
  writeFileSync(join(directory, 'report.json'), JSON.stringify(report, null, 2));
  writeFileSync(join(directory, 'servers.log'), logs.join(''));
});
