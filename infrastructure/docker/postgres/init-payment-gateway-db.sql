-- Payment Gateway Database Schema
-- This creates the necessary schema and tables for the internal payment gateway

-- Create schema for payment gateway
CREATE SCHEMA IF NOT EXISTS ipg;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA ipg TO mobility_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ipg TO mobility_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ipg TO mobility_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA ipg GRANT ALL PRIVILEGES ON TABLES TO mobility_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA ipg GRANT ALL PRIVILEGES ON SEQUENCES TO mobility_user;

-- Create client table
CREATE TABLE IF NOT EXISTS ipg.client (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL
);

-- Create client_token table
CREATE TABLE IF NOT EXISTS ipg.client_token (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES ipg.client(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create transaction table
CREATE TABLE IF NOT EXISTS ipg.transaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES ipg.client(id),
    amount BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    gateway_slug VARCHAR(100),
    gateway_trace_number VARCHAR(255),
    invoice_id VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(20),
    email VARCHAR(255),
    client_callback_url TEXT,
    gateway_token TEXT,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    version INTEGER DEFAULT 0
);

-- Create transaction audit table
CREATE TABLE IF NOT EXISTS ipg.transaction_audit (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    client_id UUID,
    amount BIGINT,
    status VARCHAR(50),
    status_modification BOOLEAN,
    gateway_slug VARCHAR(100),
    gateway_slug_modification BOOLEAN,
    gateway_trace_number VARCHAR(255),
    gateway_trace_number_modification BOOLEAN,
    invoice_id VARCHAR(255),
    mobile_number VARCHAR(20),
    email VARCHAR(255),
    client_callback_url TEXT,
    gateway_token TEXT,
    gateway_token_modification BOOLEAN,
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    updated_at_modification BOOLEAN,
    verified_at TIMESTAMP,
    verified_at_modification BOOLEAN,
    version INTEGER,
    PRIMARY KEY (id, rev)
);

-- Create revision info table
CREATE TABLE IF NOT EXISTS ipg.revision_info (
    rev SERIAL PRIMARY KEY,
    revtstmp BIGINT
);

-- Create UUID mapping table
CREATE TABLE IF NOT EXISTS ipg.uuid_mapping (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create HTTP log table
CREATE TABLE IF NOT EXISTS ipg.http_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logger VARCHAR(255),
    trace_id VARCHAR(255),
    request JSONB NOT NULL,
    response JSONB NOT NULL,
    method VARCHAR(10) NOT NULL,
    uri TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transaction_client_id ON ipg.transaction(client_id);
CREATE INDEX IF NOT EXISTS idx_transaction_invoice_id ON ipg.transaction(invoice_id);
CREATE INDEX IF NOT EXISTS idx_transaction_status ON ipg.transaction(status);
CREATE INDEX IF NOT EXISTS idx_transaction_created_at ON ipg.transaction(created_at);
CREATE INDEX IF NOT EXISTS idx_client_token_client_id ON ipg.client_token(client_id);
CREATE INDEX IF NOT EXISTS idx_client_token_token ON ipg.client_token(token);
CREATE INDEX IF NOT EXISTS idx_http_log_transaction_id ON ipg.http_log(transaction_id);

-- Insert default client for the mobility platform
INSERT INTO ipg.client (id, slug) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'mobility-platform')
ON CONFLICT (slug) DO NOTHING;

-- Insert default client token for the mobility platform
INSERT INTO ipg.client_token (client_id, token, enabled) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000', 
    'mobility-platform-token-2024-secure-key',
    true
)
ON CONFLICT (token) DO NOTHING;

-- Add comment to tables
COMMENT ON SCHEMA ipg IS 'Internal Payment Gateway Schema';
COMMENT ON TABLE ipg.client IS 'Payment gateway clients/applications';
COMMENT ON TABLE ipg.client_token IS 'Authentication tokens for clients';
COMMENT ON TABLE ipg.transaction IS 'Payment transactions';
COMMENT ON TABLE ipg.transaction_audit IS 'Audit log for transactions';
COMMENT ON TABLE ipg.http_log IS 'HTTP request/response logs for debugging';

