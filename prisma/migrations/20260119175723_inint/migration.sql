-- AlterTable
ALTER TABLE "public"."patient_intake_updates" ADD COLUMN     "generatedPoints" TEXT[] DEFAULT ARRAY[]::TEXT[];
