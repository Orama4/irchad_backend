/*
  Warnings:

  - The values [en_panne] on the enum `DeviceStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [Canne_Augmenté,Lunnettes_Connectées] on the enum `DeviceType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `battery` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `lastPos` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `macAdr` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `Device` table. All the data in the column will be lost.
  - Added the required column `macAdresse` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nom` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priority` to the `Intervention` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeviceStatus_new" AS ENUM ('connected', 'disconnected', 'under_maintenance', 'out_of_service', 'defective', 'broken_down');
ALTER TABLE "Device" ALTER COLUMN "status" TYPE "DeviceStatus_new" USING ("status"::text::"DeviceStatus_new");
ALTER TYPE "DeviceStatus" RENAME TO "DeviceStatus_old";
ALTER TYPE "DeviceStatus_new" RENAME TO "DeviceStatus";
DROP TYPE "DeviceStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "DeviceType_new" AS ENUM ('Ceinture');
ALTER TYPE "DeviceType" RENAME TO "DeviceType_old";
ALTER TYPE "DeviceType_new" RENAME TO "DeviceType";
DROP TYPE "DeviceType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Device" DROP COLUMN "battery",
DROP COLUMN "createdAt",
DROP COLUMN "lastPos",
DROP COLUMN "macAdr",
DROP COLUMN "price",
DROP COLUMN "type",
DROP COLUMN "version",
ADD COLUMN     "cpuUsage" DOUBLE PRECISION,
ADD COLUMN     "localisation" JSONB,
ADD COLUMN     "macAdresse" VARCHAR(255) NOT NULL,
ADD COLUMN     "maintainerId" INTEGER,
ADD COLUMN     "nom" VARCHAR(255) NOT NULL,
ADD COLUMN     "peripheriques" JSONB,
ADD COLUMN     "ramUsage" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Intervention" ADD COLUMN     "priority" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "address" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_maintainerId_fkey" FOREIGN KEY ("maintainerId") REFERENCES "Maintainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
