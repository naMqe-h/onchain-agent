-- CreateTable
CREATE TABLE "LlmUsageEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chatId" TEXT,
    "eveSessionId" TEXT,
    "model" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "stepIndex" INTEGER,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheReadTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheWriteTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LlmUsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserUsageDaily" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "llmInputTokens" INTEGER NOT NULL DEFAULT 0,
    "llmOutputTokens" INTEGER NOT NULL DEFAULT 0,
    "llmTotalTokens" INTEGER NOT NULL DEFAULT 0,
    "llmRequests" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserUsageDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LlmUsageEvent_userId_createdAt_idx" ON "LlmUsageEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LlmUsageEvent_userId_model_createdAt_idx" ON "LlmUsageEvent"("userId", "model", "createdAt");

-- CreateIndex
CREATE INDEX "LlmUsageEvent_eveSessionId_idx" ON "LlmUsageEvent"("eveSessionId");

-- CreateIndex
CREATE INDEX "UserUsageDaily_userId_idx" ON "UserUsageDaily"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserUsageDaily_userId_day_key" ON "UserUsageDaily"("userId", "day");
