/*
  Warnings:

  - You are about to drop the column `patientQuizId` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `documentId` on the `PatientQuiz` table. All the data in the column will be lost.
  - You are about to drop the column `patientId` on the `PatientQuiz` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Document" DROP CONSTRAINT "Document_patientQuizId_fkey";

-- DropIndex
DROP INDEX "public"."Document_patientQuizId_key";

-- DropIndex
DROP INDEX "public"."PatientQuiz_documentId_key";

-- AlterTable
ALTER TABLE "public"."Document" DROP COLUMN "patientQuizId";

-- AlterTable
ALTER TABLE "public"."PatientQuiz" DROP COLUMN "documentId",
DROP COLUMN "patientId",
ADD COLUMN     "dob" TEXT,
ADD COLUMN     "doi" TEXT,
ADD COLUMN     "patientName" TEXT;
