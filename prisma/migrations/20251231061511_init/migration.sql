-- CreateTable
CREATE TABLE "public"."treatment_histories" (
    "id" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "dob" TEXT,
    "claimNumber" TEXT,
    "physicianId" TEXT,
    "historyData" JSONB NOT NULL,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatment_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "treatment_histories_patientName_dob_claimNumber_idx" ON "public"."treatment_histories"("patientName", "dob", "claimNumber");

-- CreateIndex
CREATE INDEX "treatment_histories_physicianId_idx" ON "public"."treatment_histories"("physicianId");

-- CreateIndex
CREATE UNIQUE INDEX "treatment_histories_patientName_dob_claimNumber_physicianId_key" ON "public"."treatment_histories"("patientName", "dob", "claimNumber", "physicianId");

-- AddForeignKey
ALTER TABLE "public"."treatment_histories" ADD CONSTRAINT "treatment_histories_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
