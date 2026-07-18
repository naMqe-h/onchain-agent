-- CreateIndex
CREATE INDEX "LlmUsageEvent_chatId_idx" ON "LlmUsageEvent"("chatId");

-- CreateIndex
CREATE INDEX "LlmUsageEvent_userId_chatId_idx" ON "LlmUsageEvent"("userId", "chatId");
