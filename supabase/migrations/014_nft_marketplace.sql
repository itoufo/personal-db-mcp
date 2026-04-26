-- NFT Marketplace: Personality NFT on Base L2
-- Enables users to mint profile snapshots as ERC-721 NFTs and sell them

-- ============================================================
-- 1. wallet_addresses — User ↔ Wallet binding (SIWE verified)
-- ============================================================

CREATE TABLE personal_db.wallet_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES personal_db.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  chain_id INTEGER NOT NULL DEFAULT 8453,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  nonce TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(address, chain_id)
);

CREATE INDEX idx_wallet_addresses_user_id ON personal_db.wallet_addresses(user_id);
CREATE INDEX idx_wallet_addresses_address ON personal_db.wallet_addresses(address);

-- ============================================================
-- 2. nft_snapshots — Immutable profile data snapshot at mint time
-- ============================================================

CREATE TABLE personal_db.nft_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id UUID NOT NULL REFERENCES personal_db.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES personal_db.profiles(id) ON DELETE CASCADE,
  persona_name TEXT NOT NULL,
  persona_config JSONB NOT NULL DEFAULT '{}',
  context_markdown TEXT NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}',
  ipfs_cid TEXT,
  image_ipfs_cid TEXT,
  privacy_filters_applied JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nft_snapshots_creator ON personal_db.nft_snapshots(creator_user_id);
CREATE INDEX idx_nft_snapshots_profile ON personal_db.nft_snapshots(profile_id);

-- ============================================================
-- 3. nft_collections — Smart contract management
-- ============================================================

CREATE TABLE personal_db.nft_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL DEFAULT 8453,
  deployer_address TEXT NOT NULL,
  collection_metadata_cid TEXT,
  platform_fee_bps INTEGER NOT NULL DEFAULT 250,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contract_address, chain_id)
);

-- ============================================================
-- 4. nft_listings — Marketplace listing state machine
--    draft → minting → listed → sold | delisted
-- ============================================================

CREATE TABLE personal_db.nft_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID NOT NULL REFERENCES personal_db.nft_snapshots(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES personal_db.nft_collections(id),
  creator_user_id UUID NOT NULL REFERENCES personal_db.users(id) ON DELETE CASCADE,
  creator_wallet TEXT NOT NULL,
  token_id TEXT,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'minting', 'listed', 'sold', 'delisted')),
  price_wei TEXT,
  royalty_bps INTEGER NOT NULL DEFAULT 500 CHECK (royalty_bps BETWEEN 100 AND 1000),
  title TEXT NOT NULL,
  description TEXT,
  opensea_url TEXT,
  listed_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nft_listings_creator ON personal_db.nft_listings(creator_user_id);
CREATE INDEX idx_nft_listings_status ON personal_db.nft_listings(status);
CREATE INDEX idx_nft_listings_token ON personal_db.nft_listings(token_id);

-- ============================================================
-- 5. nft_purchases — Purchase / transfer records
-- ============================================================

CREATE TABLE personal_db.nft_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES personal_db.nft_listings(id) ON DELETE CASCADE,
  buyer_wallet TEXT NOT NULL,
  buyer_user_id UUID REFERENCES personal_db.users(id),
  tx_hash TEXT NOT NULL,
  price_wei TEXT NOT NULL,
  platform_fee_wei TEXT,
  royalty_wei TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nft_purchases_listing ON personal_db.nft_purchases(listing_id);
CREATE INDEX idx_nft_purchases_buyer ON personal_db.nft_purchases(buyer_wallet);

-- ============================================================
-- 6. nft_access_tokens — AI chat access for NFT owners
-- ============================================================

CREATE TABLE personal_db.nft_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES personal_db.nft_listings(id) ON DELETE CASCADE,
  owner_wallet TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  token_prefix TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nft_access_tokens_hash ON personal_db.nft_access_tokens(token_hash);
CREATE INDEX idx_nft_access_tokens_listing ON personal_db.nft_access_tokens(listing_id);
CREATE INDEX idx_nft_access_tokens_wallet ON personal_db.nft_access_tokens(owner_wallet);

-- ============================================================
-- 7. nft_chat_messages — AI character chat history
-- ============================================================

CREATE TABLE personal_db.nft_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token_id UUID NOT NULL REFERENCES personal_db.nft_access_tokens(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES personal_db.nft_listings(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nft_chat_messages_access ON personal_db.nft_chat_messages(access_token_id);
CREATE INDEX idx_nft_chat_messages_listing ON personal_db.nft_chat_messages(listing_id, created_at);

-- ============================================================
-- 8. RLS Policies
-- ============================================================

-- wallet_addresses
ALTER TABLE personal_db.wallet_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_all ON personal_db.wallet_addresses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY user_select_own_wallets ON personal_db.wallet_addresses
  FOR SELECT TO authenticated
  USING (user_id = personal_db.get_user_id());

CREATE POLICY user_insert_own_wallets ON personal_db.wallet_addresses
  FOR INSERT TO authenticated
  WITH CHECK (user_id = personal_db.get_user_id());

CREATE POLICY user_delete_own_wallets ON personal_db.wallet_addresses
  FOR DELETE TO authenticated
  USING (user_id = personal_db.get_user_id());

-- nft_snapshots
ALTER TABLE personal_db.nft_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_all ON personal_db.nft_snapshots
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY user_select_own_snapshots ON personal_db.nft_snapshots
  FOR SELECT TO authenticated
  USING (creator_user_id = personal_db.get_user_id());

CREATE POLICY user_insert_own_snapshots ON personal_db.nft_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (creator_user_id = personal_db.get_user_id());

-- nft_collections (read-only for authenticated, admin-managed)
ALTER TABLE personal_db.nft_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_all ON personal_db.nft_collections
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY user_select_collections ON personal_db.nft_collections
  FOR SELECT TO authenticated
  USING (is_active = true);

-- nft_listings
ALTER TABLE personal_db.nft_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_all ON personal_db.nft_listings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Creator can see all their own listings
CREATE POLICY user_select_own_listings ON personal_db.nft_listings
  FOR SELECT TO authenticated
  USING (creator_user_id = personal_db.get_user_id());

-- Anyone can see listed items (marketplace browsing)
CREATE POLICY user_select_listed ON personal_db.nft_listings
  FOR SELECT TO authenticated
  USING (status = 'listed');

CREATE POLICY user_insert_own_listings ON personal_db.nft_listings
  FOR INSERT TO authenticated
  WITH CHECK (creator_user_id = personal_db.get_user_id());

CREATE POLICY user_update_own_listings ON personal_db.nft_listings
  FOR UPDATE TO authenticated
  USING (creator_user_id = personal_db.get_user_id())
  WITH CHECK (creator_user_id = personal_db.get_user_id());

-- nft_purchases
ALTER TABLE personal_db.nft_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_all ON personal_db.nft_purchases
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY user_select_own_purchases ON personal_db.nft_purchases
  FOR SELECT TO authenticated
  USING (buyer_user_id = personal_db.get_user_id());

CREATE POLICY user_insert_purchases ON personal_db.nft_purchases
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- nft_access_tokens
ALTER TABLE personal_db.nft_access_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_all ON personal_db.nft_access_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Access tokens looked up by hash, so service_role handles most ops
-- But let users see their own tokens
CREATE POLICY user_select_own_access_tokens ON personal_db.nft_access_tokens
  FOR SELECT TO authenticated
  USING (
    owner_wallet IN (
      SELECT address FROM personal_db.wallet_addresses
      WHERE user_id = personal_db.get_user_id()
    )
  );

-- nft_chat_messages
ALTER TABLE personal_db.nft_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_all ON personal_db.nft_chat_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY user_select_own_chat ON personal_db.nft_chat_messages
  FOR SELECT TO authenticated
  USING (
    access_token_id IN (
      SELECT id FROM personal_db.nft_access_tokens
      WHERE owner_wallet IN (
        SELECT address FROM personal_db.wallet_addresses
        WHERE user_id = personal_db.get_user_id()
      )
    )
  );

CREATE POLICY user_insert_own_chat ON personal_db.nft_chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (true);
