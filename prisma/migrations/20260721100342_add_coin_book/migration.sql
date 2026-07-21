-- CreateTable
CREATE TABLE "CoinBookEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoinBookEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoinBookEntry_userId_idx" ON "CoinBookEntry"("userId");

-- CreateIndex
CREATE INDEX "CoinBookEntry_userId_symbol_idx" ON "CoinBookEntry"("userId", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "CoinBookEntry_userId_chain_address_key" ON "CoinBookEntry"("userId", "chain", "address");
