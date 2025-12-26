-- AlterTable
ALTER TABLE "public"."patient_intake_updates" ADD COLUMN     "keyFindings" TEXT;

-- AlterTable
ALTER TABLE "public"."tasks" ADD COLUMN     "type" TEXT DEFAULT 'internal';

-- CreateIndex
CREATE INDEX "tasks_type_idx" ON "public"."tasks"("type");
