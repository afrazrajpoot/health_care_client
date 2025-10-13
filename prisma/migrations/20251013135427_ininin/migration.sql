-- AlterTable
ALTER TABLE "public"."Task" ADD COLUMN     "physicianId" TEXT,
ALTER COLUMN "quickNotes" DROP NOT NULL;
