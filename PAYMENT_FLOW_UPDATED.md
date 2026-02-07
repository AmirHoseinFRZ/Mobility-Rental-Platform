# Payment Flow Documentation

## Overview

This document describes the updated payment flow for the Mobility Rental Platform.

## Authentication Token

The booking service authenticates with the payment gateway using the token:
```
8f3A9cKpQ2Lw7ZxR6M4HnB5JdE
```

## Payment Flow

### Step 1: User Initiates Payment

- User goes to the booking page and selects a vehicle to book
- User clicks the "Pay" button on the frontend

### Step 2: Booking Service Initializes Transaction

The booking service calls the payment gateway to initialize a transaction:

**Endpoint:** `POST http://payment-gateway:8089/api/new`

**Headers:**
```
Authorization: Bearer 8f3A9cKpQ2Lw7ZxR6M4HnB5JdE
Content-Type: application/json
```

**Request Body:**
```json
{
  "invoiceId": "BOOKING-12345",
  "amount": 100000,
  "mobileNumber": "09123456789",
  "email": "user@example.com",
  "callbackUrl": "http://localhost:3000/payment/callback",
  "description": "Payment for booking #12345"
}
```

**Response:**
```json
{
  "transactionId": "550e8400-e29b-41d4-a716-446655440001",
  "invoiceId": "BOOKING-12345",
  "createdAt": "2024-01-06T10:30:00"
}
```

### Step 3: Booking Service Returns Transaction ID

The booking service returns the `transactionId` to the frontend.

### Step 4: Frontend Calls Payment Gateway Directly

The frontend directly calls the payment gateway to get payment details:

**Endpoint:** `POST http://payment-gateway:8089/api/pay/v2/{transactionId}?gateway=sandbox`

**Note:** No authentication required for this endpoint

**Response:**
```json
{
  "payUrl": "https://bank-gateway.example.com/pay",
  "method": "POST",
  "params": {
    "token": "payment-token-from-bank",
    "amount": "100000"
  },
  "body": "token=payment-token-from-bank&amount=100000"
}
```

### Step 5: Frontend Redirects to Payment URL

The frontend redirects the user to the `payUrl` with the specified `method`, `params`, and `body`.

For sandbox mode, the URL will be:
```
http://payment-gateway:8089/api/sandbox/page?tid={transactionId}
```

### Step 6: User Completes Payment

The user completes the payment on the bank gateway page (or sandbox page for testing).

### Step 7: Bank Gateway Redirects to Verify Endpoint

After payment completion, the bank gateway redirects the user to:

**Endpoint:** `GET/POST http://payment-gateway:8089/api/verify/{transactionId}`

**Note:** No authentication required for this endpoint

The payment gateway verifies the payment with the bank and returns a redirect to the client callback URL.

### Step 8: Frontend Calls Booking Service

After being redirected to the callback URL, the frontend calls the booking service to submit that the booking is complete.

### Step 9: Booking Service Verifies Payment

The booking service can verify the payment status by calling:

**Endpoint:** `GET http://payment-gateway:8089/api/inquiry/{transactionId}`

**Headers:**
```
Authorization: Bearer 8f3A9cKpQ2Lw7ZxR6M4HnB5JdE
```

**Response:**
```json
{
  "transactionId": "550e8400-e29b-41d4-a716-446655440001",
  "status": "SUCCESS",
  "amount": 100000,
  "gatewayTraceNumber": "123456789"
}
```

### Step 10: Booking Service Confirms Booking

If the payment is verified successfully, the booking service confirms the booking and returns success to the frontend.

## Security Configuration

### Payment Gateway Security Rules

The payment gateway has the following security configuration:

- **Authenticated Endpoints** (require Bearer token):
  - `POST /new` - Create new transaction
  - `GET /inquiry/{transactionId}` - Inquiry transaction status

- **Public Endpoints** (no authentication required):
  - `POST /pay/{transactionId}` - Get payment link (v1)
  - `POST /pay/v2/{transactionId}` - Get payment link with detailed response (v2)
  - `GET/POST /verify/{transactionId}` - Verify payment
  - `GET /sandbox/page` - Sandbox payment page
  - `GET /gateway/all` - List all available gateways

## Database Changes

### For New Installations

The database initialization script has been updated to use the new token `8f3A9cKpQ2Lw7ZxR6M4HnB5JdE`.

### For Existing Installations

Run the migration script to add the new token:

```bash
docker exec -i mobility-postgres psql -U mobility_user -d mobility_platform < infrastructure/docker/postgres/migrate-add-new-token.sql
```

Or manually connect to the database and run:

```sql
INSERT INTO ipg.client_token (client_id, token, enabled) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000', 
    '8f3A9cKpQ2Lw7ZxR6M4HnB5JdE',
    true
)
ON CONFLICT (token) DO NOTHING;
```

## Environment Variables

Update the booking service environment variables:

```bash
PAYMENT_GATEWAY_URL=http://payment-gateway:8089/api
PAYMENT_GATEWAY_TOKEN=8f3A9cKpQ2Lw7ZxR6M4HnB5JdE
```

## Testing the Flow

### 1. Create a Transaction

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

### 2. Get Payment Link (Detailed Response)

```bash
curl -X POST "http://localhost:8089/api/pay/v2/{transactionId}?gateway=sandbox"
```

### 3. Complete Payment (Sandbox)

Open in browser:
```
http://localhost:8089/api/sandbox/page?tid={transactionId}
```

### 4. Verify Transaction Status

```bash
curl -X GET http://localhost:8089/api/inquiry/{transactionId} \
  -H "Authorization: Bearer 8f3A9cKpQ2Lw7ZxR6M4HnB5JdE"
```

## API Response Formats

### NewTransactionResponseDTO

```java
{
    UUID transactionId,
    String invoiceId,
    LocalDateTime createdAt
}
```

### PayResponseDTOV2

```java
{
    String payUrl,
    RequestMethod method,
    Map<String, String> params,
    String body
}
```

### VerifyResponseDTO

```java
{
    String clientCallbackURL
}
```

## Notes

- Use `/pay/v2/{transactionId}` endpoint to get detailed payment information (method, params, body)
- The verify endpoint automatically redirects to the client callback URL after verification
- The booking service should use the inquiry endpoint to verify payment status before confirming bookings
- For production, replace `gateway=sandbox` with the actual bank gateway slug (e.g., `gateway=pasargad`)







