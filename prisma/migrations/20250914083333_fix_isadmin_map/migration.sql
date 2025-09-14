/*
  Warnings:

  - You are about to drop the column `isAdmin` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "isAdmin",
ADD COLUMN     "is_admin" BOOLEAN NOT NULL DEFAULT false;
