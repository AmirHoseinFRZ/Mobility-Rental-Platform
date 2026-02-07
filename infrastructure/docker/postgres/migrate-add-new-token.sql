-- Migration script to add new payment gateway token
-- This script updates existing databases with the new token for booking service

-- Add the new token for the mobility-platform client
INSERT INTO ipg.client_token (client_id, token, is_active) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000', 
    '8f3A9cKpQ2Lw7ZxR6M4HnB5JdE',
    true
)
ON CONFLICT (token) DO NOTHING;

-- Optionally, you can disable the old token if you want to enforce using only the new one
-- UPDATE ipg.client_token 
-- SET is_active = false 
-- WHERE token = 'mobility-platform-token-2024-secure-key';

-- Verify the tokens
SELECT ct.token, ct.is_active, ct.expires_at, c.slug 
FROM ipg.client_token ct 
JOIN ipg.client c ON ct.client_id = c.id 
WHERE c.slug = 'mobility-platform';

