-- CreateEnum
CREATE TYPE "PayType" AS ENUM ('hourly', 'per_period', 'total', 'milestone', 'non_cash', 'not_specified');

-- CreateEnum
CREATE TYPE "PayPeriod" AS ENUM ('week', 'two_weeks', 'month');

-- CreateEnum
CREATE TYPE "ConditionsStatus" AS ENUM ('confirmed', 'reported', 'unknown');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('active', 'retired');

-- CreateEnum
CREATE TYPE "JobOutcome" AS ENUM ('yes', 'no', 'unknown');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "Verification" AS ENUM ('self_reported', 'navigator_verified', 'org_confirmed');

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "area" TEXT,
    "shortDescription" TEXT,
    "infoUrl" TEXT,
    "payType" "PayType" NOT NULL DEFAULT 'not_specified',
    "payAmountCents" INTEGER,
    "payMaxAmountCents" INTEGER,
    "payPeriod" "PayPeriod",
    "payMilestones" INTEGER,
    "payItems" TEXT[],
    "payExtras" TEXT[],
    "conditionsStatus" "ConditionsStatus" NOT NULL DEFAULT 'unknown',
    "conditionsNote" TEXT,
    "conditionsSource" TEXT,
    "duration" TEXT,
    "status" "ProgramStatus" NOT NULL DEFAULT 'active',
    "lastConfirmedAt" TIMESTAMP(3),
    "isSample" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutcomeReport" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "exitDate" TIMESTAMP(3) NOT NULL,
    "jobWithin90Days" "JobOutcome" NOT NULL DEFAULT 'unknown',
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "verification" "Verification" NOT NULL DEFAULT 'self_reported',
    "reporterId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "isSample" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutcomeReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutcomeReport_programId_status_idx" ON "OutcomeReport"("programId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "OutcomeReport_programId_reporterId_key" ON "OutcomeReport"("programId", "reporterId");

-- AddForeignKey
ALTER TABLE "OutcomeReport" ADD CONSTRAINT "OutcomeReport_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
