import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addPrice, assertActive, assertOngoing, assertLockerEditable, PERIOD_DURATION_MS, splitRevenue, ticketPriority } from '../src/common/domain';

test('comissão de 10% em centavos conserva bruto = taxa + líquido, inclusive arredondamentos', () => {
  assert.deepEqual(splitRevenue(1000), { grossAmountCents: 1000, platformFeeCents: 100, partnerNetCents: 900 });
  for (const amount of [1, 5, 101, 999, 4500, 12000]) {
    const r = splitRevenue(amount);
    assert.equal(r.platformFeeCents + r.partnerNetCents, amount);
    assert.equal(Number.isInteger(r.partnerNetCents), true);
  }
});
test('períodos e acumulação de preços são exatos; overflow é recusado', () => {
  assert.equal(PERIOD_DURATION_MS.DAILY, 24 * 3600000);
  assert.equal(PERIOD_DURATION_MS.WEEKLY, 7 * PERIOD_DURATION_MS.DAILY);
  assert.equal(PERIOD_DURATION_MS.MONTHLY, 30 * PERIOD_DURATION_MS.DAILY);
  assert.equal(addPrice(500, 2500), 3000);
  assert.throws(() => addPrice(2_147_483_647, 1));
});
test('transições operacionais exigem Active e locker ocupado não aceita manutenção', () => {
  assert.doesNotThrow(() => assertActive('Active'));
  for (const status of ['Expired', 'Incident', 'Completed', 'Cancelled']) assert.throws(() => assertActive(status));
  assert.throws(() => assertLockerEditable('OCCUPIED', false));
  assert.throws(() => assertLockerEditable('AVAILABLE', true));
  assert.doesNotThrow(() => assertLockerEditable('MAINTENANCE', false));
});
test('categorias críticas recebem prioridade HIGH automaticamente', () => {
  for (const category of ['LOCKER_WONT_OPEN', 'ITEMS_TRAPPED', 'EXPIRED_RENTAL'] as const) assert.equal(ticketPriority(category), 'HIGH');
  assert.equal(ticketPriority('OTHER'), 'MEDIUM');
});
test('vigência inclui início e exclui instante do término, mesmo com status Active persistido', () => {
  const startTime = new Date('2026-11-04T12:00:00Z');
  const endTime = new Date('2026-11-05T12:00:00Z');
  const reservation = { status: 'Active', startTime, endTime };
  assert.doesNotThrow(() => assertOngoing(reservation, startTime));
  assert.doesNotThrow(() => assertOngoing(reservation, new Date(endTime.getTime() - 1)));
  assert.throws(() => assertOngoing(reservation, endTime));
  assert.throws(() => assertOngoing(reservation, new Date(startTime.getTime() - 1)));
});
