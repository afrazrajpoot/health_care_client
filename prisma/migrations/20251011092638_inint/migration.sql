/*
  Warnings:

  - Added the required column `reportDate` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Made the column `doi` on table `Document` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN     "reportDate" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "doi" SET NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
