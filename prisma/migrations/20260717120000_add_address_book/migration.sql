-- CreateTable
CREATE TABLE "AddressBookEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddressBookEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AddressBookEntry_userId_idx" ON "AddressBookEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AddressBookEntry_userId_name_key" ON "AddressBookEntry"("userId", "name");
