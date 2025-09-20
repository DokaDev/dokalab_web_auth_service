/*
  Warnings:

  - Made the column `nickName` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "nickName" SET NOT NULL;
