-- =====================================================
-- DATABASE SCHEMA FOR MODULES 9, 10, 11
-- Agent Detection, Auto-Debate, Conversion Tracking
-- =====================================================

-- Module 9: Competitor Agents (Enhanced)
CREATE TABLE IF NOT EXISTS "competitor_agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "twitter_handle" TEXT NOT NULL UNIQUE,
    "contract_address" TEXT,
    "token_symbol" TEXT,
    "narrative" TEXT NOT NULL,
    "verification_method" TEXT NOT NULL, -- 'bio_link', 'manual_whitelist', 'shadow_agent'
    "is_shadow_agent" BOOLEAN NOT NULL DEFAULT false,
    "threat_level" TEXT NOT NULL DEFAULT 'LOW', -- 'LOW', 'MEDIUM', 'HIGH'
    "market_cap" NUMERIC DEFAULT 0,
    "holders" INTEGER DEFAULT 0,
    "treasury_balance" NUMERIC DEFAULT 0,
    "discovered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "competitor_agents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "competitor_agents_threat_level_idx" ON "competitor_agents"("threat_level");
CREATE INDEX IF NOT EXISTS "competitor_agents_is_shadow_idx" ON "competitor_agents"("is_shadow_agent");

-- Module 10: Debates
CREATE TABLE IF NOT EXISTS "debates" (
    "id" TEXT NOT NULL,
    "competitor_agent_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active', -- 'active', 'won', 'lost', 'abandoned'
    "exchanges" INTEGER NOT NULL DEFAULT 0,
    "our_last_argument" TEXT,
    "their_last_argument" TEXT,
    "initial_tweet_id" TEXT,
    "latest_tweet_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_exchange_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "debates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "debates_competitor_agent_fkey" FOREIGN KEY ("competitor_agent_id")
        REFERENCES "competitor_agents"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "debates_status_idx" ON "debates"("status");
CREATE INDEX IF NOT EXISTS "debates_competitor_idx" ON "debates"("competitor_agent_id");

-- Module 10: Debate Exchanges (individual messages in a debate)
CREATE TABLE IF NOT EXISTS "debate_exchanges" (
    "id" TEXT NOT NULL,
    "debate_id" TEXT NOT NULL,
    "speaker" TEXT NOT NULL, -- 'pontiff' or 'competitor'
    "argument" TEXT NOT NULL,
    "tweet_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debate_exchanges_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "debate_exchanges_debate_fkey" FOREIGN KEY ("debate_id")
        REFERENCES "debates"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "debate_exchanges_debate_idx" ON "debate_exchanges"("debate_id");

-- Module 11: Conversions
CREATE TABLE IF NOT EXISTS "conversions" (
    "id" TEXT NOT NULL,
    "competitor_agent_id" TEXT NOT NULL,
    "conversion_type" TEXT NOT NULL, -- 'acknowledgment', 'token_purchase', 'retweet', 'challenge_accepted', 'game_loss'
    "evidence_type" TEXT NOT NULL, -- 'tweet', 'transaction', 'game'
    "evidence_data" JSONB NOT NULL, -- tweet ID, tx hash, game ID
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "conversions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "conversions_competitor_agent_fkey" FOREIGN KEY ("competitor_agent_id")
        REFERENCES "competitor_agents"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "conversions_type_idx" ON "conversions"("conversion_type");
CREATE INDEX IF NOT EXISTS "conversions_competitor_idx" ON "conversions"("competitor_agent_id");
CREATE INDEX IF NOT EXISTS "conversions_verified_idx" ON "conversions"("verified");

-- World Events (for activity feed)
CREATE TABLE IF NOT EXISTS "world_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL, -- 'agent_detected', 'debate_started', 'conversion', 'challenge', etc.
    "agent_wallet" TEXT,
    "description" TEXT NOT NULL,
    "event_data" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "world_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "world_events_type_idx" ON "world_events"("event_type");
CREATE INDEX IF NOT EXISTS "world_events_timestamp_idx" ON "world_events"("timestamp" DESC);

-- Shadow Agents (for demo insurance)
CREATE TABLE IF NOT EXISTS "shadow_agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL UNIQUE,
    "twitter_handle" TEXT,
    "behavior_type" TEXT NOT NULL, -- 'loses_games', 'debates_loses', 'converts_easily'
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "actions_performed" INTEGER NOT NULL DEFAULT 0,
    "last_action_at" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "shadow_agents_pkey" PRIMARY KEY ("id")
);
