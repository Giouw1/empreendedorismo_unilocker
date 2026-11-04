-- Invariantes não expressáveis no schema Prisma: retenção e valores inteiros.
CREATE UNIQUE INDEX "Reservation_one_holding_per_locker"
ON "Reservation"("lockerId") WHERE "status" IN ('Active','Expired','Incident');

CREATE TRIGGER "PricingPlan_positive_insert" BEFORE INSERT ON "PricingPlan"
WHEN NEW."priceCents" <= 0 OR typeof(NEW."priceCents") <> 'integer'
BEGIN SELECT RAISE(ABORT, 'invalid_price'); END;
CREATE TRIGGER "PricingPlan_positive_update" BEFORE UPDATE OF "priceCents" ON "PricingPlan"
WHEN NEW."priceCents" <= 0 OR typeof(NEW."priceCents") <> 'integer'
BEGIN SELECT RAISE(ABORT, 'invalid_price'); END;
