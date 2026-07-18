-- CreateTable
CREATE TABLE "ChatFolder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatFolder_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pinnedAt" TIMESTAMP(3),
ADD COLUMN     "folderId" TEXT;

-- CreateIndex
CREATE INDEX "ChatFolder_userId_idx" ON "ChatFolder"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatFolder_userId_name_key" ON "ChatFolder"("userId", "name");

-- CreateIndex
CREATE INDEX "Chat_userId_isArchived_idx" ON "Chat"("userId", "isArchived");

-- CreateIndex
CREATE INDEX "Chat_userId_isPinned_idx" ON "Chat"("userId", "isPinned");

-- CreateIndex
CREATE INDEX "Chat_folderId_idx" ON "Chat"("folderId");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "ChatFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
