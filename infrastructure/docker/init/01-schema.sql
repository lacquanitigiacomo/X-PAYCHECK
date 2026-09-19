-- X-PAY CHECK Database Initialization
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    auth_provider VARCHAR(20) CHECK (auth_provider IN ('email', 'google', 'apple')) DEFAULT 'email',
    provider_id VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tier VARCHAR(10) CHECK (tier IN ('free', 'pro', 'trial')) NOT NULL DEFAULT 'free',
    status VARCHAR(10) CHECK (status IN ('active', 'expired', 'revoked')) NOT NULL DEFAULT 'active',
    trial_started_at TIMESTAMP,
    trial_ends_at TIMESTAMP,
    purchased_at TIMESTAMP,
    transaction_id_apple VARCHAR(255),
    transaction_id_google VARCHAR(255),
    UNIQUE (user_id, tier)
);

CREATE TABLE IF NOT EXISTS backup_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(64) NOT NULL,
    checkpoint_json JSONB NOT NULL,
    file_list TEXT[] NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ccnl_id VARCHAR(50) NOT NULL,
    version VARCHAR(10) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    released_at TIMESTAMP DEFAULT NOW(),
    valid_from DATE NOT NULL,
    valid_to DATE,
    UNIQUE (ccnl_id, version)
);

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    ip_hash VARCHAR(64),
    user_agent_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_licenses_user ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_user ON backup_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_created ON audit_log(user_id, created_at DESC);
