/*
  Warnings:

  - You are about to drop the column `patientQuiz` on the `Document` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[patientQuizId]` on the table `Document` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[documentId]` on the table `PatientQuiz` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Document" DROP COLUMN "patientQuiz",
ADD COLUMN     "patientQuizId" TEXT;

-- AlterTable
ALTER TABLE "public"."PatientQuiz" ADD COLUMN     "documentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Document_patientQuizId_key" ON "public"."Document"("patientQuizId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientQuiz_documentId_key" ON "public"."PatientQuiz"("documentId");

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_patientQuizId_fkey" FOREIGN KEY ("patientQuizId") REFERENCES "public"."PatientQuiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;
