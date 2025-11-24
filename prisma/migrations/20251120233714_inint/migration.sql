/*
  Warnings:

  - You are about to drop the `ADL` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `DocumentSummary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `FailDocs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SummarySnapshot` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."ADL" DROP CONSTRAINT "ADL_documentId_fkey";

-- AlterTable
ALTER TABLE "public"."DocumentSummary" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."FailDocs" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."SummarySnapshot" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."body_part_snapshots" ADD COLUMN     "adlsAffected" TEXT,
ADD COLUMN     "functionalLimitations" TEXT,
ADD COLUMN     "lifestyleRecommendations" TEXT,
ADD COLUMN     "mmiStatus" TEXT,
ADD COLUMN     "painLevel" TEXT,
ADD COLUMN     "returnToWorkPlan" TEXT,
ALTER COLUMN "bodyPart" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."ADL";

-- CreateTable
CREATE TABLE "public"."adls" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'wc',
    "adlsAffected" TEXT NOT NULL,
    "workRestrictions" TEXT NOT NULL,
    "dailyLivingImpact" TEXT,
    "functionalLimitations" TEXT,
    "symptomImpact" TEXT,
    "qualityOfLife" TEXT,
    "workImpact" TEXT,
    "physicalDemands" TEXT,
    "workCapacity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "adls_documentId_key" ON "public"."adls"("documentId");

-- CreateIndex
CREATE INDEX "adls_mode_idx" ON "public"."adls"("mode");

-- CreateIndex
CREATE INDEX "adls_documentId_idx" ON "public"."adls"("documentId");

-- AddForeignKey
ALTER TABLE "public"."adls" ADD CONSTRAINT "adls_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
