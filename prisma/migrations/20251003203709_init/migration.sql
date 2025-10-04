/*
  Warnings:

  - You are about to drop the `WhatsNewSinceLastVisit` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."WhatsNewSinceLastVisit" DROP CONSTRAINT "WhatsNewSinceLastVisit_documentId_fkey";

-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN     "briefSummary" TEXT,
ADD COLUMN     "physicianId" TEXT,
ADD COLUMN     "whatsNew" JSONB;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "physicianId" TEXT;

-- DropTable
DROP TABLE "public"."WhatsNewSinceLastVisit";
