/*
  Warnings:

  - Added the required column `bodyPart` to the `SummarySnapshot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."SummarySnapshot" ADD COLUMN     "bodyPart" TEXT NOT NULL,
ALTER COLUMN "consultingDoctor" DROP NOT NULL,
ALTER COLUMN "consultingDoctor" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "public"."BodyPartSnapshot" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "bodyPart" TEXT NOT NULL,
    "dx" TEXT NOT NULL,
    "keyConcern" TEXT NOT NULL,
    "nextStep" TEXT,
    "urDecision" TEXT,
    "recommended" TEXT,
    "aiOutcome" TEXT,
    "consultingDoctor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyPartSnapshot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."BodyPartSnapshot" ADD CONSTRAINT "BodyPartSnapshot_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
