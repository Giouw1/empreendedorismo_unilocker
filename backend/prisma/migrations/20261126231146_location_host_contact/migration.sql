-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campus" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "block" TEXT NOT NULL,
    "floor" TEXT NOT NULL,
    "roomOrCorridor" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "openingHours" TEXT NOT NULL,
    "accessInstructions" TEXT NOT NULL,
    "usageRules" TEXT NOT NULL,
    "photoUrlsJson" TEXT NOT NULL DEFAULT '[]',
    "hostName" TEXT NOT NULL DEFAULT '',
    "contactPhone" TEXT NOT NULL DEFAULT '',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Location_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Location" ("accessInstructions", "block", "building", "campus", "createdAt", "floor", "id", "latitude", "longitude", "name", "openingHours", "partnerId", "photoUrlsJson", "reference", "roomOrCorridor", "status", "updatedAt", "usageRules") SELECT "accessInstructions", "block", "building", "campus", "createdAt", "floor", "id", "latitude", "longitude", "name", "openingHours", "partnerId", "photoUrlsJson", "reference", "roomOrCorridor", "status", "updatedAt", "usageRules" FROM "Location";
DROP TABLE "Location";
ALTER TABLE "new_Location" RENAME TO "Location";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Pré-reserva também retém o compartimento: no máximo uma reserva retentora por locker.
DROP INDEX IF EXISTS "Reservation_one_holding_per_locker";
CREATE UNIQUE INDEX "Reservation_one_holding_per_locker"
ON "Reservation"("lockerId") WHERE "status" IN ('PendingConfirmation','Active','Expired','Incident');
