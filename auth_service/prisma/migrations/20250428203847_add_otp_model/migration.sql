-- CreateTable
CREATE TABLE "Otp" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "otp" VARCHAR(6) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);
