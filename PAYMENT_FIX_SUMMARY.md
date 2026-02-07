# Payment Gateway Authentication Fix - Summary

## Problem
The booking service was getting a 401 Unauthorized error when creating transactions because it was not using the correct authentication token that exists in the payment gateway database.

## Solution
Updated all configuration files to use the token `8f3A9cKpQ2Lw7ZxR6M4HnB5JdE` which is already configured in the database for the `mobility-platform` client.

## Files Changed

### 1. Database Initialization Script
**File:** `infrastructure/docker/postgres/init-payment-gateway-db.sql`
- Updated default client token from `mobility-platform-token-2024-secure-key` to `8f3A9cKpQ2Lw7ZxR6M4HnB5JdE`

### 2. Booking Service Configuration
**File:** `backend/booking-service/src/main/resources/application.yml`
- Updated payment gateway token default value to `8f3A9cKpQ2Lw7ZxR6M4HnB5JdE`

### 3. Environment Configuration
**File:** `env.example`
- Updated `PAYMENT_GATEWAY_TOKEN` to `8f3A9cKpQ2Lw7ZxR6M4HnB5JdE`

### 4. Docker Compose Configuration
**File:** `docker-compose.yml`
- Updated booking service environment variable `PAYMENT_GATEWAY_TOKEN` to `8f3A9cKpQ2Lw7ZxR6M4HnB5JdE`

### 5. Migration Script (for existing databases)
**File:** `infrastructure/docker/postgres/migrate-add-new-token.sql`
- Created migration script to add the new token to existing databases (not needed if token already exists)

### 6. Documentation
**File:** `PAYMENT_FLOW_UPDATED.md`
- Created comprehensive documentation of the complete payment flow

## Payment Flow Overview

### Step-by-Step Process

1. **User Action**: User clicks "Pay" button on booking page

2. **Booking → Payment Gateway** (Authenticated)
   ```
   POST /api/new
   Authorization: Bearer 8f3A9cKpQ2Lw7ZxR6M4HnB5JdE
   ```
   **Returns**: `{ transactionId, invoiceId, createdAt }`

3. **Booking → Frontend**: Returns `transactionId`

4. **Frontend → Payment Gateway** (No Auth Required)
   ```
   POST /api/pay/v2/{transactionId}?gateway=sandbox
   ```
   **Returns**: `{ payUrl, method, params, body }`

5. **Frontend → Bank Gateway**: Redirects user to `payUrl` with params and body

6. **User Completes Payment**: User pays on bank gateway page

7. **Bank Gateway → Payment Gateway** (No Auth Required)
   ```
   POST /api/verify/{transactionId}
   ```
   **Returns**: Redirect to client callback URL

8. **Frontend → Booking Service**: Calls booking service to confirm payment

9. **Booking → Payment Gateway** (Authenticated)
   ```
   GET /api/inquiry/{transactionId}
   Authorization: Bearer 8f3A9cKpQ2Lw7ZxR6M4HnB5JdE
   ```
   **Returns**: Transaction status and verification

10. **Booking Confirmed**: If payment verified, booking is confirmed

## Security Configuration

### Payment Gateway Endpoints

**Authenticated** (require Bearer token `8f3A9cKpQ2Lw7ZxR6M4HnB5JdE`):
- `POST /new` - Create transaction
- `GET /inquiry/{transactionId}` - Check transaction status

**Public** (no authentication):
- `POST /pay/{transactionId}` - Get payment link (v1)
- `POST /pay/v2/{transactionId}` - Get payment link with details (v2)
- `GET/POST /verify/{transactionId}` - Verify payment
- `GET /sandbox/page` - Sandbox payment page
- `GET /gateway/all` - List available gateways

## Testing the Fix

### 1. Verify Database Token
```sql
SELECT ct.token, ct.enabled, c.slug 
FROM ipg.client_token ct 
JOIN ipg.client c ON ct.client_id = c.id 
WHERE c.slug = 'mobility-platform';
```

Expected output should include token: `8f3A9cKpQ2Lw7ZxR6M4HnB5JdE` with `enabled = true`

### 2. Start Services

If using Docker Compose:
```bash
docker-compose up -d payment-gateway booking-service
```

If running standalone:
```bash
# Terminal 1 - Payment Gateway
cd backend/internal-payment-gateway
./mvnw spring-boot:run

# Terminal 2 - Booking Service
cd backend/booking-service
./mvnw spring-boot:run
```

### 3. Test Transaction Creation

```bash
curl -X POST http://localhost:8089/api/new \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 8f3A9cKpQ2Lw7ZxR6M4HnB5JdE" \
  -d '{
    "invoiceId": "TEST-12345",
    "amount": 100000,
    "mobileNumber": "09123456789",
    "email": "test@example.com",
    "callbackUrl": "http://localhost:3000/payment/callback",
    "description": "Test payment"
  }'
```

**Expected**: HTTP 200 with transaction details (no 401 error)

### 4. Test Payment Link (V2 - Detailed Response)

```bash
# Replace {transactionId} with the ID from step 3
curl -X POST "http://localhost:8089/api/pay/v2/{transactionId}?gateway=sandbox"
```

**Expected**: HTTP 200 with `{ payUrl, method, params, body }`

### 5. Test Sandbox Payment

Open in browser:
```
http://localhost:8089/api/sandbox/page?tid={transactionId}
```

Click "Complete Payment" button to simulate successful payment.

### 6. Test Transaction Inquiry

```bash
# Replace {transactionId} with the ID from step 3
curl -X GET http://localhost:8089/api/inquiry/{transactionId} \
  -H "Authorization: Bearer 8f3A9cKpQ2Lw7ZxR6M4HnB5JdE"
```

**Expected**: HTTP 200 with transaction status (should be "SUCCESS" after sandbox payment)

## Key Differences from Previous Setup

### Previous Token
- `mobility-platform-token-2024-secure-key` (not in database)

### New Token
- `8f3A9cKpQ2Lw7ZxR6M4HnB5JdE` (exists in database)

### API Response Formats

**Transaction Creation Response:**
```json
{
  "transactionId": "uuid-here",
  "invoiceId": "BOOKING-12345",
  "createdAt": "2024-01-06T10:30:00"
}
```

**Payment Link V2 Response:**
```json
{
  "payUrl": "https://bank.example.com/pay",
  "method": "POST",
  "params": {
    "token": "bank-token",
    "amount": "100000"
  },
  "body": "token=bank-token&amount=100000"
}
```

**Verify Response:**
- Returns HTTP 302 redirect to client callback URL

## Troubleshooting

### Still Getting 401 Error

1. **Check token in database:**
   ```sql
   SELECT * FROM ipg.client_token WHERE token = '8f3A9cKpQ2Lw7ZxR6M4HnB5JdE';
   ```

2. **Check booking service configuration:**
   ```bash
   # If running with Docker
   docker exec booking-service env | grep PAYMENT_GATEWAY_TOKEN
   
   # Check application.yml is loaded
   cat backend/booking-service/src/main/resources/application.yml | grep -A2 "payment:"
   ```

3. **Restart services** to pick up new configuration:
   ```bash
   docker-compose restart booking-service payment-gateway
   ```

4. **Check logs:**
   ```bash
   # Payment Gateway logs
   docker logs payment-gateway -f
   
   # Booking Service logs
   docker logs booking-service -f
   ```

### Token Not Found in Database

If the token doesn't exist in the database, run:
```bash
docker exec -i mobility-postgres psql -U mobility_user -d mobility_platform < infrastructure/docker/postgres/migrate-add-new-token.sql
```

Or manually insert:
```sql
INSERT INTO ipg.client_token (client_id, token, enabled) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000', 
    '8f3A9cKpQ2Lw7ZxR6M4HnB5JdE',
    true
)
ON CONFLICT (token) DO NOTHING;
```

## Next Steps

1. **Restart Services**: Restart both booking and payment gateway services to pick up the new configuration
2. **Test the Flow**: Follow the testing steps above to verify the fix
3. **Update Environment Variables**: If you have a `.env` file, update it with the new token
4. **Deploy**: When deploying to other environments, ensure the token is updated

## Additional Resources

- `PAYMENT_FLOW_UPDATED.md` - Complete payment flow documentation
- `PAYMENT_GATEWAY_SETUP.md` - Payment gateway setup guide
- `infrastructure/docker/postgres/migrate-add-new-token.sql` - Database migration script

## Notes

- The token `8f3A9cKpQ2Lw7ZxR6M4HnB5JdE` is associated with the client `mobility-platform` (UUID: `550e8400-e29b-41d4-a716-446655440000`)
- This token must be sent in the `Authorization: Bearer {token}` header for authenticated endpoints
- Public endpoints (`/pay/*`, `/verify/*`, `/sandbox/*`) do not require authentication
- For production, use a more secure token and consider rotating it periodically







