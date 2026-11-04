import 'reflect-metadata';
import assert from 'node:assert/strict';
import { before, beforeEach, after, describe, test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { resolve } from 'node:path';
import { INestApplication } from '@nestjs/common';
import { createApp } from '../src/bootstrap';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { Clock } from '../src/common/domain';
import { seedDatabase } from '../prisma/seed';

describe('Contrato MVP — HTTP + SQLite real', { concurrency: false }, () => {
  let app: INestApplication;
  let db: PrismaService;
  let base: string;
  let tokens: Record<string, string>;
  const covered = new Set<string>();
  const emails: Record<string, string> = { cintra: 'cintra@poli.ufrj.br', joaquim: 'joaquim@letras.ufrj.br', guilherme: 'guilherme@eba.ufrj.br', admin: 'admin@unilocker.ufrj.br', cantina: 'cantina@ccmn.ufrj.br' };
  const route = (path: string) => path.split('?')[0].replace(/\/(loc-[\w-]+|lk-[\w-]+|res-[\w-]+|p-[\w-]+|tk-[\w-]+|expired-[\w-]+|[0-9a-f]{8}-[0-9a-f-]{27,})/g, '/:id');
  async function api(path: string, method = 'GET', body?: object, persona?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (persona) headers.Authorization = `Bearer ${tokens[persona] ?? persona}`;
    const result = await fetch(`${base}/api${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    if (result.ok) covered.add(`${method} ${route(path)}`);
    return { status: result.status, body: await result.json() as any };
  }
  async function login(persona: string) {
    const result = await api('/auth/login', 'POST', { email: emails[persona], password: '123456' });
    assert.equal(result.status, 200, JSON.stringify(result.body));
    return result.body.accessToken as string;
  }
  async function reserve(lockerId?: string, size = 'SMALL') {
    return api('/reservations', 'POST', { locationId: 'loc-eba', size, period: 'DAILY', ...(lockerId ? { lockerId } : {}) }, 'joaquim');
  }
  before(async () => {
    mkdirSync(resolve('test-results'), { recursive: true });
    const directory = mkdtempSync(resolve('test-results', 'e2e-'));
    process.env.DATABASE_URL = `file:${resolve(directory, 'test.db').replaceAll('\\', '/')}`;
    execFileSync(process.execPath, [resolve('node_modules/prisma/build/index.js'), 'migrate', 'deploy'], { env: process.env, stdio: 'pipe' });
    app = await createApp(false);
    await app.listen(0, '127.0.0.1'); base = await app.getUrl();
    db = app.get(PrismaService);
  });
  beforeEach(async () => {
    await db.$transaction([db.supportTicket.deleteMany(), db.accessEvent.deleteMany(), db.reservation.deleteMany(), db.pricingPlan.deleteMany(), db.locker.deleteMany(), db.location.deleteMany(), db.partner.deleteMany(), db.user.deleteMany()]);
    await seedDatabase(db);
    tokens = {};
    for (const p of Object.keys(emails)) tokens[p] = await login(p);
  });
  after(async () => { await app?.close(); });

  test('personas, JWT, hash bcrypt, rejeição de token mock e perfil atualizado', async () => {
    for (const persona of ['cintra', 'joaquim', 'guilherme', 'admin']) {
      const result = await api('/users/me', 'GET', undefined, persona);
      assert.equal(result.status, 200);
      assert.equal(result.body.email, emails[persona]);
      assert.equal(result.body.passwordHash, undefined);
      assert.ok(tokens[persona].split('.').length === 3);
    }
    assert.equal((await api('/users/me', 'GET', undefined, 'mock-token-u-admin')).status, 401);
    assert.equal((await api('/auth/login', 'POST', { email: emails.cintra, password: 'errada' })).status, 401);
    assert.ok((await db.user.findUniqueOrThrow({ where: { id: 'u-cintra' } })).passwordHash.startsWith('$2b$'));
    assert.deepEqual((await api('/users/me', 'PATCH', { name: 'Cintra Teste', universityAffiliation: 'Poli UFRJ' }, 'cintra')).body.roles, ['USER']);
    const created = await api('/auth/register', 'POST', { name: 'Teste', email: ' NOVO@example.org ', password: '123456', universityAffiliation: 'UFRJ' });
    assert.equal(created.status, 201);
    assert.equal(created.body.user.email, 'novo@example.org');
    assert.deepEqual(created.body.user.roles, ['USER']);
    assert.equal((await api('/auth/register', 'POST', { name: 'Teste', email: 'novo@example.org', password: '123456', universityAffiliation: 'UFRJ' })).status, 409);
  });

  test('senhas Unicode respeitam o limite bcrypt em bytes e não são truncadas silenciosamente', async () => {
    const password = 'á'.repeat(36); // 36 caracteres, 72 bytes UTF-8.
    const body = { name: 'Senha Unicode', email: 'unicode@example.org', password, universityAffiliation: 'UFRJ' };
    assert.equal((await api('/auth/register', 'POST', { ...body, password: `${password}x` })).status, 400);
    assert.equal((await api('/auth/register', 'POST', body)).status, 201);
    assert.equal((await api('/auth/login', 'POST', { email: body.email, password })).status, 200);
    assert.equal((await api('/auth/login', 'POST', { email: body.email, password: `${password}outro` })).status, 400);
  });

  test('catálogo, filtros combinados, boolean false, detalhe e disponibilidade', async () => {
    const list = await api('/locations?onlyAvailable=false');
    assert.equal(list.body.length, 2);
    assert.ok(list.body.every((l: any) => l.status === 'ACTIVE' && Number.isInteger(l.startingDailyPriceCents)));
    assert.equal((await api('/locations?size=SMALL&period=DAILY&maxPriceCents=500&onlyAvailable=true')).body.length, 1);
    assert.equal((await api('/locations?size=LARGE&period=DAILY&maxPriceCents=500&onlyAvailable=true')).body.length, 0);
    assert.equal((await api('/locations?campus=Outro')).body.length, 0);
    assert.equal((await api('/locations?search=ARTES')).body[0].id, 'loc-eba');
    const detail = await api('/locations/loc-eba');
    assert.equal(detail.body.pricingPlans.length, 9);
    assert.equal(detail.body.availableBySize.SMALL, 1);
    assert.equal((await api('/locations/loc-eba/lockers')).body.length, 6);
    assert.deepEqual((await api('/lockers/lk-eba-a-02/availability?period=WEEKLY')).body, { available: true, priceCents: 2500 });
    assert.equal((await api('/locations/loc-letras')).status, 404);
    assert.equal((await api('/locations/loc-letras', 'GET', undefined, 'admin')).status, 200);
  });

  test('ciclo completo sem pagamento: alocar, ativar, abrir, prorrogar, contabilizar e encerrar', async () => {
    const before = (await api('/partner/financial', 'GET', undefined, 'guilherme')).body;
    const created = await reserve();
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const r = created.body;
    assert.equal(r.status, 'Active'); assert.equal(r.totalPriceCents, 500); assert.equal(r.lockerCode, 'A-02');
    assert.equal((await api(`/reservations/${r.id}`, 'GET', undefined, 'joaquim')).body.id, r.id);
    assert.equal((await db.locker.findUniqueOrThrow({ where: { id: r.lockerId } })).status, 'OCCUPIED');
    const mine = await api('/reservations/me', 'GET', undefined, 'joaquim');
    assert.ok(mine.body.active.some((v: any) => v.id === r.id));
    const opened = await api(`/reservations/${r.id}/unlock`, 'POST', undefined, 'joaquim');
    assert.equal(opened.body.result, 'CONFIRMED'); assert.equal(opened.body.lockerCode, 'A-02');
    assert.ok(opened.body.message.includes('simulada'));
    assert.equal((await api(`/reservations/${r.id}/access-events`, 'GET', undefined, 'joaquim')).body.length, 1);
    assert.equal((await api(`/reservations/${r.id}/cancel`, 'POST', undefined, 'joaquim')).status, 409);
    const extended = await api(`/reservations/${r.id}/extend`, 'POST', { additionalPeriod: 'WEEKLY' }, 'joaquim');
    assert.equal(extended.body.totalPriceCents, 3000);
    assert.equal(new Date(extended.body.endTime).getTime() - new Date(r.endTime).getTime(), 7 * 86400000);
    const financial = (await api('/partner/financial', 'GET', undefined, 'guilherme')).body;
    assert.equal(financial.grossTotalCents - before.grossTotalCents, 3000);
    assert.equal(financial.platformCommissionCents - before.platformCommissionCents, 300);
    assert.equal(financial.partnerNetTotalCents - before.partnerNetTotalCents, 2700);
    assert.equal((await api(`/reservations/${r.id}/complete`, 'POST', { confirmedEmptyAndClosed: false }, 'joaquim')).status, 400);
    assert.equal((await api(`/reservations/${r.id}/complete`, 'POST', { confirmedEmptyAndClosed: true }, 'joaquim')).body.status, 'Completed');
    assert.equal((await db.locker.findUniqueOrThrow({ where: { id: r.lockerId } })).status, 'AVAILABLE');
    assert.ok((await api('/reservations/me', 'GET', undefined, 'joaquim')).body.history.some((v: any) => v.id === r.id));
  });

  test('concorrência no mesmo locker e alocação automática em lockers diferentes', async () => {
    const results = await Promise.all(Array.from({ length: 8 }, () => reserve('lk-eba-a-02')));
    assert.equal(results.filter(r => r.status === 201).length, 1, JSON.stringify(results));
    assert.equal(results.filter(r => r.status === 409).length, 7);
    assert.equal(await db.reservation.count({ where: { lockerId: 'lk-eba-a-02', status: 'Active' } }), 1);
    const automatic = await Promise.all([reserve(undefined, 'MEDIUM'), reserve(undefined, 'MEDIUM')]);
    assert.ok(automatic.every(r => r.status === 201), JSON.stringify(automatic));
    assert.notEqual(automatic[0].body.lockerId, automatic[1].body.lockerId);
  });

  test('cancelamento elegível libera locker e exclui receita; manutenção é bloqueada se ocupado', async () => {
    const r = (await reserve()).body;
    assert.equal((await api(`/partner/lockers/${r.lockerId}`, 'PATCH', { status: 'MAINTENANCE' }, 'guilherme')).status, 409);
    assert.equal((await api(`/reservations/${r.id}/cancel`, 'POST', undefined, 'joaquim')).body.status, 'Cancelled');
    assert.equal((await api(`/partner/lockers/${r.lockerId}`, 'PATCH', { status: 'MAINTENANCE' }, 'guilherme')).status, 200);
    assert.equal((await reserve(r.lockerId)).status, 409);
    assert.equal((await api('/partner/financial', 'GET', undefined, 'guilherme')).body.entries.some((e: any) => e.reservationId === r.id), false);
  });

  test('ownership, RBAC e recusas de abertura são auditados', async () => {
    assert.equal((await api('/admin/users', 'GET', undefined, 'cintra')).status, 403);
    assert.equal((await api('/partner/dashboard', 'GET', undefined, 'cantina')).status, 403);
    assert.equal((await api('/reservations/res-cintra-active', 'GET', undefined, 'joaquim')).status, 403);
    assert.equal((await api('/reservations/res-cintra-active/unlock', 'POST', undefined, 'joaquim')).status, 403);
    assert.equal(await db.accessEvent.count({ where: { userId: 'u-joaquim', result: 'UNAUTHORIZED' } }), 1);
    assert.equal((await api('/partner/lockers/lk-ct-b-01', 'PATCH', { status: 'BLOCKED' }, 'guilherme')).status, 403);
    assert.equal((await api('/support/tickets', 'POST', { reservationId: 'res-cintra-active', category: 'OTHER', description: 'Tentativa indevida' }, 'joaquim')).status, 403);
  });

  test('Expired não libera; admin resolve ocorrência e libera sem afetar nova ocupação', async () => {
    await db.reservation.update({ where: { id: 'res-cintra-active' }, data: { endTime: new Date(Date.now() - 1000) } });
    const mine = await api('/reservations/me', 'GET', undefined, 'cintra');
    assert.equal(mine.body.active[0].status, 'Expired');
    assert.equal((await db.locker.findUniqueOrThrow({ where: { id: 'lk-ct-b-05' } })).status, 'OCCUPIED');
    assert.equal((await api('/reservations/res-cintra-active/unlock', 'POST', undefined, 'cintra')).body.result, 'UNAUTHORIZED');
    assert.equal((await api('/reservations/res-cintra-active/extend', 'POST', { additionalPeriod: 'DAILY' }, 'cintra')).status, 409);
    assert.equal((await api('/reservations/res-cintra-active/complete', 'POST', { confirmedEmptyAndClosed: true }, 'cintra')).status, 409);
    const incidents = (await api('/admin/incidents?status=OPEN', 'GET', undefined, 'admin')).body;
    const incident = incidents.find((t: any) => t.category === 'EXPIRED_RENTAL');
    assert.equal(incident.priority, 'HIGH');
    await api('/admin/incidents', 'GET', undefined, 'admin');
    assert.equal(await db.supportTicket.count({ where: { category: 'EXPIRED_RENTAL' } }), 1);
    assert.equal((await api(`/admin/incidents/${incident.id}`, 'PATCH', { status: 'RESOLVED', adminNotes: 'Vistoria e retirada confirmadas', releaseLocker: true }, 'admin')).status, 200);
    assert.equal((await db.locker.findUniqueOrThrow({ where: { id: 'lk-ct-b-05' } })).status, 'AVAILABLE');
    const again = await api('/reservations', 'POST', { locationId: 'loc-ct', lockerId: 'lk-ct-b-05', size: 'MEDIUM', period: 'DAILY' }, 'joaquim');
    assert.equal(again.status, 201);
    assert.equal((await api(`/admin/incidents/${incident.id}`, 'PATCH', { status: 'RESOLVED', releaseLocker: true }, 'admin')).status, 409);
    assert.equal((await db.locker.findUniqueOrThrow({ where: { id: 'lk-ct-b-05' } })).status, 'OCCUPIED');
  });

  test('vencimento entre reconciliação e transação não permite prorrogar, concluir ou cancelar', async () => {
    const r = (await reserve()).body;
    const boundary = new Date(Date.now() + 60_000);
    await db.reservation.update({ where: { id: r.id }, data: { endTime: boundary } });
    const clock = app.get(Clock);
    const originalNow = clock.now;
    try {
      for (const [action, body] of [
        ['extend', { additionalPeriod: 'DAILY' }],
        ['complete', { confirmedEmptyAndClosed: true }],
        ['cancel', undefined],
      ] as const) {
        let reads = 0;
        clock.now = () => new Date(boundary.getTime() - (reads++ === 0 ? 1 : 0));
        const result = await api(`/reservations/${r.id}/${action}`, 'POST', body, 'joaquim');
        assert.equal(result.status, 409, `${action}: ${JSON.stringify(result.body)}`);
        const unchanged = await db.reservation.findUniqueOrThrow({ where: { id: r.id } });
        assert.equal(unchanged.totalPriceCents, r.totalPriceCents);
        assert.equal(unchanged.endTime.getTime(), boundary.getTime());
        assert.equal((await db.locker.findUniqueOrThrow({ where: { id: r.lockerId } })).status, 'OCCUPIED');
      }
      clock.now = () => boundary;
      assert.equal((await api(`/reservations/${r.id}`, 'GET', undefined, 'joaquim')).body.status, 'Expired');
    } finally {
      clock.now = originalNow;
    }
  });

  test('parceiro cria/edita ponto, adiciona lockers e admin publica após validar preços', async () => {
    const body = { locationData: { name: 'Novo laboratório', campus: 'Fundão', building: 'EBA', block: 'A', floor: 'Térreo', roomOrCorridor: 'Entrada', reference: 'Portaria', latitude: -22.86, longitude: -43.22, openingHours: '24 horas', accessInstructions: 'Na entrada principal', usageRules: 'Retire seus objetos', photoUrls: [] },
      lockersData: [{ code: 'N-01', size: 'SMALL' }], pricingPlans: ['DAILY', 'WEEKLY', 'MONTHLY'].map(period => ({ size: 'SMALL', period, priceCents: 501 })) };
    const created = await api('/partner/locations', 'POST', body, 'guilherme');
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const id = created.body.id;
    assert.equal(created.body.status, 'PENDING_APPROVAL');
    assert.equal((await api(`/locations/${id}`, 'GET', undefined, 'guilherme')).status, 200);
    assert.equal((await api(`/locations/${id}`)).status, 404);
    assert.equal((await api(`/partner/locations/${id}`, 'PATCH', { accessInstructions: 'Use a entrada lateral' }, 'guilherme')).body.accessInstructions, 'Use a entrada lateral');
    const add = await api(`/partner/locations/${id}/lockers`, 'POST', { lockers: [{ code: 'N-02', size: 'SMALL' }] }, 'guilherme');
    assert.equal(add.body.length, 2);
    assert.equal((await api(`/partner/locations/${id}/lockers`, 'POST', { lockers: [{ code: 'N-03', size: 'SMALL' }, { code: 'N-01', size: 'SMALL' }] }, 'guilherme')).status, 409);
    assert.equal(await db.locker.count({ where: { locationId: id } }), 2);
    assert.equal((await api(`/admin/locations/${id}/approve`, 'POST', { approved: true }, 'admin')).body.status, 'ACTIVE');
    assert.equal((await api(`/locations/${id}`)).status, 200);
    const rents = await api('/partner/reservations?locationId=loc-eba&status=Active', 'GET', undefined, 'guilherme');
    assert.ok(rents.body.every((r: any) => r.locationId === 'loc-eba' && r.status === 'Active'));
    assert.equal((await api('/partner/dashboard', 'GET', undefined, 'guilherme')).body.partner.id, 'p-guilherme');
  });

  test('aprovação de parceiro atualiza roles em sessão existente e candidatura rejeitada pode ser reenviada', async () => {
    const pending = await api('/admin/partners/pending', 'GET', undefined, 'admin');
    assert.equal(pending.body.length, 1);
    assert.equal((await api('/admin/partners/p-cantina/approve', 'POST', { approved: true }, 'admin')).body.status, 'APPROVED');
    assert.deepEqual((await api('/users/me', 'GET', undefined, 'cantina')).body.roles, ['USER', 'PARTNER']);
    assert.equal((await api('/partner/dashboard', 'GET', undefined, 'cantina')).status, 200);
    await api('/admin/partners/p-cantina/approve', 'POST', { approved: false }, 'admin');
    const applied = await api('/partners/applications', 'POST', { organizationName: 'Cantina nova', organizationType: 'Cantina', responsibleName: 'Antônio', contactPhone: '21999999999' }, 'cantina');
    assert.equal(applied.body.status, 'PENDING');
  });

  test('suporte prioritário, incidente retido e filtros administrativos', async () => {
    const ticket = await api('/support/tickets', 'POST', { reservationId: 'res-cintra-active', category: 'ITEMS_TRAPPED', description: 'Meu notebook ficou preso no compartimento.' }, 'cintra');
    assert.equal(ticket.status, 201); assert.equal(ticket.body.priority, 'HIGH');
    assert.equal((await db.reservation.findUniqueOrThrow({ where: { id: 'res-cintra-active' } })).status, 'Incident');
    assert.ok((await api('/support/tickets/me', 'GET', undefined, 'cintra')).body.some((t: any) => t.id === ticket.body.id));
    assert.equal((await api('/admin/users?search=cintra', 'GET', undefined, 'admin')).body.length, 1);
    assert.equal((await api('/admin/partners/pending?includeAll=false', 'GET', undefined, 'admin')).body.length, 1);
    assert.equal((await api('/admin/partners/pending?includeAll=true', 'GET', undefined, 'admin')).body.length, 4);
    assert.equal((await api('/admin/locations?status=PENDING_APPROVAL', 'GET', undefined, 'admin')).body.length, 1);
    assert.equal((await api('/admin/reservations?userId=u-cintra&status=Incident', 'GET', undefined, 'admin')).body.length, 1);
    assert.equal((await api('/admin/dashboard', 'GET', undefined, 'admin')).body.totalUsers, 7);
  });

  test('validação real de DTOs, enums, valores monetários e JSON booleano', async () => {
    assert.equal((await api('/auth/register', 'POST', { name: 'Intruso', email: 'a@example.org', password: '123456', universityAffiliation: 'UFRJ', roles: ['ADMIN'] })).status, 400);
    assert.equal((await api('/reservations', 'POST', { locationId: 'loc-eba', size: 'SMALL', period: 'YEARLY' }, 'joaquim')).status, 400);
    assert.equal((await api('/users/me', 'PATCH', { name: null }, 'cintra')).status, 400);
    assert.equal((await api('/locations?onlyAvailable=banana')).status, 400);
    assert.equal((await api('/admin/partners/p-cantina/approve', 'POST', {}, 'admin')).status, 400);
    assert.equal((await api('/partner/locations', 'POST', {}, 'guilherme')).status, 400);
    assert.equal((await api('/locations?maxPriceCents=1.5')).status, 400);
  });

  test('CORS autoriza origem do frontend e bloqueia origens externas', async () => {
    const allowed = await fetch(`${base}/api/reservations`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } });
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    const blocked = await fetch(`${base}/api/locations`, { headers: { Origin: 'https://outro.example' } });
    assert.equal(blocked.headers.get('access-control-allow-origin'), null);
  });

  test('seed é idempotente e dados continuam disponíveis após reconectar SQLite', async () => {
    const count = await db.reservation.count();
    await seedDatabase(db);
    assert.equal(await db.reservation.count(), count);
    assert.equal(await db.user.count(), 7);
    await db.$disconnect(); await db.$connect();
    assert.equal((await api('/users/me', 'GET', undefined, 'cintra')).body.id, 'u-cintra');
  });

  test('os 35 endpoints oficiais foram exercitados com sucesso', () => {
    const expected = [
      'POST /auth/register','POST /auth/login','GET /users/me','PATCH /users/me','GET /locations','GET /locations/:id','GET /locations/:id/lockers','GET /lockers/:id/availability',
      'POST /reservations','GET /reservations/me','GET /reservations/:id','POST /reservations/:id/extend','POST /reservations/:id/complete','POST /reservations/:id/cancel',
      'POST /reservations/:id/unlock','GET /reservations/:id/access-events','POST /partners/applications','GET /partner/dashboard','POST /partner/locations','PATCH /partner/locations/:id',
      'POST /partner/locations/:id/lockers','PATCH /partner/lockers/:id','GET /partner/reservations','GET /partner/financial','POST /support/tickets','GET /support/tickets/me',
      'GET /admin/dashboard','GET /admin/users','GET /admin/partners/pending','POST /admin/partners/:id/approve','GET /admin/locations','POST /admin/locations/:id/approve','GET /admin/reservations','GET /admin/incidents','PATCH /admin/incidents/:id',
    ];
    assert.deepEqual(expected.filter(endpoint => !covered.has(endpoint)), []);
  });
});
