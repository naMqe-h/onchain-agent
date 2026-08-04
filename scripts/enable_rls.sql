ALTER TABLE "Wallet" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Wallet_select_owner" ON "Wallet";
CREATE POLICY "Wallet_select_owner" ON "Wallet"
  FOR SELECT TO anon, authenticated
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Wallet_service_all" ON "Wallet";
CREATE POLICY "Wallet_service_all" ON "Wallet"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE "ChatFolder" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ChatFolder_select_owner" ON "ChatFolder";
CREATE POLICY "ChatFolder_select_owner" ON "ChatFolder"
  FOR SELECT TO anon, authenticated
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "ChatFolder_service_all" ON "ChatFolder";
CREATE POLICY "ChatFolder_service_all" ON "ChatFolder"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE "Chat" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chat_select_owner" ON "Chat";
CREATE POLICY "Chat_select_owner" ON "Chat"
  FOR SELECT TO anon, authenticated
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Chat_service_all" ON "Chat";
CREATE POLICY "Chat_service_all" ON "Chat"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Message_select_owner" ON "Message";
CREATE POLICY "Message_select_owner" ON "Message"
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM "Chat"
    WHERE "Chat".id = "Message"."chatId"
      AND "Chat"."userId" = auth.uid()::text
  ));

DROP POLICY IF EXISTS "Message_service_all" ON "Message";
CREATE POLICY "Message_service_all" ON "Message"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profile_select_owner" ON "Profile";
CREATE POLICY "Profile_select_owner" ON "Profile"
  FOR SELECT TO anon, authenticated
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Profile_service_all" ON "Profile";
CREATE POLICY "Profile_service_all" ON "Profile"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE "AddressBookEntry" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "AddressBookEntry_select_owner" ON "AddressBookEntry";
CREATE POLICY "AddressBookEntry_select_owner" ON "AddressBookEntry"
  FOR SELECT TO anon, authenticated
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "AddressBookEntry_service_all" ON "AddressBookEntry";
CREATE POLICY "AddressBookEntry_service_all" ON "AddressBookEntry"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE "CoinBookEntry" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CoinBookEntry_select_owner" ON "CoinBookEntry";
CREATE POLICY "CoinBookEntry_select_owner" ON "CoinBookEntry"
  FOR SELECT TO anon, authenticated
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "CoinBookEntry_service_all" ON "CoinBookEntry";
CREATE POLICY "CoinBookEntry_service_all" ON "CoinBookEntry"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE "ChatModel" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ChatModel_select_public" ON "ChatModel";
CREATE POLICY "ChatModel_select_public" ON "ChatModel"
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "ChatModel_service_all" ON "ChatModel";
CREATE POLICY "ChatModel_service_all" ON "ChatModel"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE "LlmUsageEvent" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "LlmUsageEvent_select_owner" ON "LlmUsageEvent";
CREATE POLICY "LlmUsageEvent_select_owner" ON "LlmUsageEvent"
  FOR SELECT TO anon, authenticated
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "LlmUsageEvent_service_all" ON "LlmUsageEvent";
CREATE POLICY "LlmUsageEvent_service_all" ON "LlmUsageEvent"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE "UserUsageDaily" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "UserUsageDaily_select_owner" ON "UserUsageDaily";
CREATE POLICY "UserUsageDaily_select_owner" ON "UserUsageDaily"
  FOR SELECT TO anon, authenticated
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "UserUsageDaily_service_all" ON "UserUsageDaily";
CREATE POLICY "UserUsageDaily_service_all" ON "UserUsageDaily"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE "UserProviderKey" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "UserProviderKey_select_owner" ON "UserProviderKey";
CREATE POLICY "UserProviderKey_select_owner" ON "UserProviderKey"
  FOR SELECT TO anon, authenticated
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "UserProviderKey_service_all" ON "UserProviderKey";
CREATE POLICY "UserProviderKey_service_all" ON "UserProviderKey"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE "UserCustomModel" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "UserCustomModel_select_owner" ON "UserCustomModel";
CREATE POLICY "UserCustomModel_select_owner" ON "UserCustomModel"
  FOR SELECT TO anon, authenticated
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "UserCustomModel_service_all" ON "UserCustomModel";
CREATE POLICY "UserCustomModel_service_all" ON "UserCustomModel"
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

