-- Migration script to update client_token table schema
-- This script adds is_active and expires_at columns to match the entity definition
-- and migrates data from the old 'enabled' column to 'is_active'

-- Add is_active column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'ipg' 
        AND table_name = 'client_token' 
        AND column_name = 'is_active'
    ) THEN
        -- Add is_active column
        ALTER TABLE ipg.client_token ADD COLUMN is_active BOOLEAN;
        
        -- Migrate data from enabled to is_active
        UPDATE ipg.client_token SET is_active = enabled WHERE is_active IS NULL;
        
        -- Set default and make it NOT NULL
        ALTER TABLE ipg.client_token ALTER COLUMN is_active SET DEFAULT true;
        ALTER TABLE ipg.client_token ALTER COLUMN is_active SET NOT NULL;
    END IF;
END $$;

-- Add expires_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'ipg' 
        AND table_name = 'client_token' 
        AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE ipg.client_token ADD COLUMN expires_at TIMESTAMP;
    END IF;
END $$;

-- Note: The 'enabled' column is kept for backward compatibility but can be dropped later
-- if you want to remove it, uncomment the following:
-- ALTER TABLE ipg.client_token DROP COLUMN IF EXISTS enabled;







