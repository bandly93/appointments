-- CreateEnum
CREATE TYPE "DocumentRequestStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'FULFILLED', 'DECLINED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "DocumentRequest" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "message" TEXT,
    "status" "DocumentRequestStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "accessTokenHash" TEXT NOT NULL,
    "verificationCodeHash" TEXT,
    "verificationExpiresAt" TIMESTAMP(3),
    "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRequest_accessTokenHash_key" ON "DocumentRequest"("accessTokenHash");

-- CreateIndex
CREATE INDEX "DocumentRequest_patientId_idx" ON "DocumentRequest"("patientId");

-- AddForeignKey
ALTER TABLE "DocumentRequest" ADD CONSTRAINT "DocumentRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
