/*
  Warnings:

  - Added the required column `documentParse` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."subscriptions" ADD COLUMN     "documentParse" INTEGER NOT NULL;
