/*
  Warnings:

  - A unique constraint covering the columns `[fileHash,userId]` on the table `Document` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN     "fileHash" VARCHAR(64),
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Document_fileHash_userId_key" ON "public"."Document"("fileHash", "userId");

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
