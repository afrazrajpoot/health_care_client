-- AlterTable
ALTER TABLE "public"."body_part_snapshots" ADD COLUMN     "chronicCondition" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "comorbidities" TEXT,
ADD COLUMN     "condition" TEXT,
ADD COLUMN     "conditionSeverity" TEXT,
ADD COLUMN     "injuryType" TEXT,
ADD COLUMN     "medications" TEXT,
ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'wc',
ADD COLUMN     "permanentImpairment" TEXT,
ADD COLUMN     "symptoms" TEXT,
ADD COLUMN     "workRelatedness" TEXT;

-- CreateIndex
CREATE INDEX "body_part_snapshots_mode_idx" ON "public"."body_part_snapshots"("mode");

-- CreateIndex
CREATE INDEX "body_part_snapshots_documentId_idx" ON "public"."body_part_snapshots"("documentId");
