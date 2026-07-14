/*
  Warnings:

  - A unique constraint covering the columns `[userId,name]` on the table `Wallet` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Wallet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_name_key" ON "Wallet"("userId", "name");
