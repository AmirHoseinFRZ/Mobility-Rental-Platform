-- Migration script to convert transaction status from integer to string
-- This script converts any existing integer status values to their corresponding enum string names
-- and ensures the status column is VARCHAR (which it should already be)

-- Convert integer status values to string enum names in transaction table
DO $$
DECLARE
    status_count INTEGER;
BEGIN
    -- Check if there are any numeric status values that need conversion
    SELECT COUNT(*) INTO status_count
    FROM ipg.transaction
    WHERE status ~ '^[0-9]+$' AND status::integer BETWEEN 1 AND 5;
    
    IF status_count > 0 THEN
        -- Update status values: 1 -> CREATED, 2 -> PENDING, 3 -> SUCCESS, 4 -> CANCELED, 5 -> FAILED
        UPDATE ipg.transaction 
        SET status = CASE 
            WHEN status::integer = 1 THEN 'CREATED'
            WHEN status::integer = 2 THEN 'PENDING'
            WHEN status::integer = 3 THEN 'SUCCESS'
            WHEN status::integer = 4 THEN 'CANCELED'
            WHEN status::integer = 5 THEN 'FAILED'
            ELSE status
        END
        WHERE status ~ '^[0-9]+$' AND status::integer BETWEEN 1 AND 5;
        
        RAISE NOTICE 'Converted % transaction status values from integer to string', status_count;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If conversion fails (e.g., status is already string), just continue
        RAISE NOTICE 'Transaction status conversion skipped: %', SQLERRM;
END $$;

-- Convert integer status values to string enum names in transaction_audit table
DO $$
DECLARE
    status_count INTEGER;
BEGIN
    -- Check if there are any numeric status values that need conversion
    SELECT COUNT(*) INTO status_count
    FROM ipg.transaction_audit
    WHERE status IS NOT NULL AND status ~ '^[0-9]+$' AND status::integer BETWEEN 1 AND 5;
    
    IF status_count > 0 THEN
        -- Update status values: 1 -> CREATED, 2 -> PENDING, 3 -> SUCCESS, 4 -> CANCELED, 5 -> FAILED
        UPDATE ipg.transaction_audit 
        SET status = CASE 
            WHEN status::integer = 1 THEN 'CREATED'
            WHEN status::integer = 2 THEN 'PENDING'
            WHEN status::integer = 3 THEN 'SUCCESS'
            WHEN status::integer = 4 THEN 'CANCELED'
            WHEN status::integer = 5 THEN 'FAILED'
            ELSE status
        END
        WHERE status IS NOT NULL AND status ~ '^[0-9]+$' AND status::integer BETWEEN 1 AND 5;
        
        RAISE NOTICE 'Converted % transaction_audit status values from integer to string', status_count;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If conversion fails (e.g., status is already string), just continue
        RAISE NOTICE 'Transaction audit status conversion skipped: %', SQLERRM;
END $$;

-- Ensure the status column is VARCHAR (should already be, but just to be safe)
DO $$
BEGIN
    -- Check if status column exists and is not already VARCHAR
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'ipg' 
        AND table_name = 'transaction' 
        AND column_name = 'status'
        AND data_type != 'character varying'
    ) THEN
        ALTER TABLE ipg.transaction ALTER COLUMN status TYPE VARCHAR(50);
        RAISE NOTICE 'Changed transaction.status column type to VARCHAR(50)';
    END IF;
END $$;

