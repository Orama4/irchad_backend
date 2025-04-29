-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'commercial';
ALTER TYPE "Role" ADD VALUE 'decider';
ALTER TYPE "Role" ADD VALUE 'endUser';
ALTER TYPE "Role" ADD VALUE 'helper';
ALTER TYPE "Role" ADD VALUE 'maintainer';

-- CreateTable
CREATE TABLE "Otp" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "otp" VARCHAR(6) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);
