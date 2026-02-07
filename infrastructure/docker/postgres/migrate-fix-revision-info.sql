-- Migration script to fix revision_info table structure
-- This script updates the revision_info table to match the entity definition

-- Drop the old table if it exists (only if it has the old structure)
DO $$
BEGIN
    -- Check if the old column 'rev' exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'ipg' 
        AND table_name = 'revision_info' 
        AND column_name = 'rev'
    ) THEN
        -- Drop the old table
        DROP TABLE IF EXISTS ipg.revision_info CASCADE;
        
        -- Drop the old sequence if it exists
        DROP SEQUENCE IF EXISTS ipg.revision_info_rev_seq;
    END IF;
END $$;

-- Create the sequence if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS ipg.revision_info_id_seq;

-- Create the revision info table with correct structure
CREATE TABLE IF NOT EXISTS ipg.revision_info (
    id BIGINT PRIMARY KEY DEFAULT nextval('ipg.revision_info_id_seq'),
    timestamp TIMESTAMP NOT NULL,
    client_id VARCHAR(255),
    uri TEXT,
    trace_id VARCHAR(255)
);

-- Set sequence ownership
ALTER SEQUENCE ipg.revision_info_id_seq OWNED BY ipg.revision_info.id;

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE ipg.revision_info TO mobility_user;
GRANT ALL PRIVILEGES ON SEQUENCE ipg.revision_info_id_seq TO mobility_user;

-- Update transaction_audit to use BIGINT for rev if it's currently INTEGER
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'ipg' 
        AND table_name = 'transaction_audit' 
        AND column_name = 'rev'
        AND data_type = 'integer'
    ) THEN
        -- Alter the column type from INTEGER to BIGINT
        ALTER TABLE ipg.transaction_audit ALTER COLUMN rev TYPE BIGINT;
    END IF;
END $$;







