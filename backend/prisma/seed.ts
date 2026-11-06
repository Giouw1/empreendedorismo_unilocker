import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { DemoFixtures } from './demo-fixtures';

/** Seed idempotente: preserva alterações e não reabre/reseta reservas existentes. */
export async function seedDatabase(db: PrismaClient) {
  const fixtures = new DemoFixtures();
  const passwordHash = await hash('123456', 10);
  await db.$transaction(async tx => {
    for (const { password, roles, ...u } of fixtures.users) {
      await tx.user.upsert({ where: { email: u.email }, update: {}, create: { ...u, passwordHash, rolesJson: JSON.stringify(roles) } });
    }
    for (const p of fixtures.partners) await tx.partner.upsert({ where: { id: p.id }, update: {}, create: p });
    for (const { photoUrls, ...l } of fixtures.locations) {
      await tx.location.upsert({
        where: { id: l.id },
        update: {
          name: l.name,
          campus: l.campus,
          building: l.building,
          block: l.block,
          floor: l.floor,
          roomOrCorridor: l.roomOrCorridor,
          reference: l.reference,
          latitude: l.latitude,
          longitude: l.longitude,
          openingHours: l.openingHours,
          accessInstructions: l.accessInstructions,
          usageRules: l.usageRules,
          photoUrlsJson: JSON.stringify(photoUrls),
          status: l.status,
        },
        create: { ...l, photoUrlsJson: JSON.stringify(photoUrls) },
      });
    }
    for (const k of fixtures.lockers) await tx.locker.upsert({ where: { id: k.id }, update: {}, create: k });
    for (const p of fixtures.pricingPlans) await tx.pricingPlan.upsert({ where: { id: p.id }, update: {}, create: p });
    for (const r of fixtures.reservations) await tx.reservation.upsert({ where: { id: r.id }, update: {}, create: r });
    for (const e of fixtures.accessEvents) await tx.accessEvent.upsert({ where: { id: e.id }, update: {}, create: e });
    for (const t of fixtures.supportTickets) await tx.supportTicket.upsert({ where: { id: t.id }, update: {}, create: t });
  }, { timeout: 30000 });
}
if (require.main === module) {
  const db = new PrismaClient();
  seedDatabase(db).then(() => console.log('Seed UFRJ concluído. Personas: senha 123456 (bcrypt).'))
    .catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
}
