/*
  Warnings:

  - You are about to drop the column `dayOfWeek` on the `availability_slots` table. All the data in the column will be lost.
  - Added the required column `date` to the `availability_slots` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "availability_slots_technicianProfileId_idx";

-- AlterTable
ALTER TABLE "availability_slots" DROP COLUMN "dayOfWeek",
ADD COLUMN     "date" DATE NOT NULL;

-- CreateIndex
CREATE INDEX "availability_slots_technicianProfileId_date_idx" ON "availability_slots"("technicianProfileId", "date");
