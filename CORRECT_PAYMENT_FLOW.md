# Correct Payment Flow Implementation

## Overview

This document describes the **correct** payment flow where:
- **Booking Service** creates transactions (with authentication)
- **Frontend** calls payment gateway **directly** to get payment details (no authentication)
- **Booking Service** verifies payments (with authentication)

## Architecture

```
┌─────────┐         ┌──────────────┐         ┌─────────────────┐
│         │         │              │         │                 │
│ Frontend├────────►│ API Gateway  ├────────►│ Booking Service │
│         │         │  (port 8080) │         │   (port 8083)   │
└────┬────┘         └──────────────┘         └────────┬────────┘
     │                                                 │
     │  Direct Call (no API Gateway)                  │ Authenticated
     │                                                 │ with token
     │              ┌─────────────────┐                │
     └─────────────►│ Payment Gateway │◄───────────────┘
                    │   (port 8089)   │
                    └─────────────────┘
```

## Step-by-Step Flow

### Step 1: User Initiates Payment

**Location:** Frontend - Booking Page

User clicks the "Pay" button to book a vehicle.

### Step 2: Frontend → API Gateway → Booking Service (Create Transaction)

**Endpoint:** `POST http://api-gateway:8080/api/payments/transaction/create`

**API Gateway Route:**
- Receives: `/api/payments/transaction/create`
- Rewrites to: `/api/bookings/payments/transaction/create`
- Forwards to: `booking-service`

**Request:**
```json
{
  "invoiceId": "BOOKING-12345",
  "amount": 100000,
  "mobileNumber": "09123456789",
  "email": "user@example.com",
  "callbackUrl": "http://frontend:3000/payment/callback",
  "description": "Payment for booking #12345"
}
```

### Step 3: Booking Service → Payment Gateway (Initialize Transaction)

**Endpoint:** `POST http://payment-gateway:8089/api/new`

**Headers:**
```
Authorization: Bearer 8f3A9cKpQ2Lw7ZxR6M4HnB5JdE
Content-Type: application/json
```

**Response to Frontend:**
```json
{
  "transactionId": "550e8400-e29b-41d4-a716-446655440001",
  "invoiceId": "BOOKING-12345",
  "createdAt": "2024-01-06T10:30:00"
}
```

### Step 4: Frontend → Payment Gateway (Get Payment Details) **DIRECT**

**Important:** This call **bypasses the API Gateway** and goes **directly** to the payment gateway.

**Endpoint:** `POST http://payment-gateway:8089/api/pay/v2/{transactionId}?gateway=sandbox`

**No Authentication Required**

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

Frontend creates a form and submits it to `payUrl` with the `method`, `params`, and `body` from the response.

For **sandbox mode**, the URL will be:
```
http://payment-gateway:8089/api/sandbox/page?tid={transactionId}
```

### Step 6: User Completes Payment

User completes the payment on the bank gateway page (or clicks "Complete Payment" in sandbox).

### Step 7: Bank Gateway → Payment Gateway (Verify)

**Endpoint:** `POST http://payment-gateway:8089/api/verify/{transactionId}`

**No Authentication Required**

The payment gateway:
1. Verifies the payment with the bank
2. Updates transaction status
3. Redirects to the client callback URL

**Response:** HTTP 302 Redirect to callback URL

### Step 8: Frontend Calls Booking Service (Confirm Booking)

After being redirected to the callback URL, frontend calls booking service to finalize the booking.

**Endpoint:** `POST http://api-gateway:8080/api/bookings/{bookingId}/confirm`

### Step 9: Booking Service → Payment Gateway (Verify Payment)

**Endpoint:** `GET http://payment-gateway:8089/api/inquiry/{transactionId}`

**Headers:**
```
Authorization: Bearer 8f3A9cKpQ2Lw7ZxR6M4HnB5JdE
```

**Response:**
```json
{
  "transactionId": "550e8400-e29b-41d4-a716-446655440001",
  "invoiceId": "BOOKING-12345",
  "amount": 100000,
  "status": "SUCCESS",
  "gatewaySlug": "sandbox",
  "createdAt": "2024-01-06T10:30:00",
  "updatedAt": "2024-01-06T10:32:00"
}
```

### Step 10: Booking Confirmed

If payment is verified (`status === "SUCCESS"`), booking service confirms the booking and returns success to frontend.

## Configuration Changes Made

### 1. API Gateway Configuration

**File:** `backend/api-gateway/src/main/resources/application.yml`

Added route to forward `/api/payments/**` to booking service:

```yaml
- id: payment-routes
  uri: lb://booking-service
  predicates:
    - Path=/api/payments/**
  filters:
    - RewritePath=/api/payments/(?<segment>.*), /api/bookings/payments/$\{segment}
```

### 2. Booking Service Configuration

**File:** `backend/booking-service/src/main/resources/application.yml`

Updated payment gateway token:

```yaml
payment:
  gateway:
    url: ${PAYMENT_GATEWAY_URL:http://localhost:8089/api}
    token: ${PAYMENT_GATEWAY_TOKEN:8f3A9cKpQ2Lw7ZxR6M4HnB5JdE}
```

### 3. Environment Variables

**Files:** `env.example`, `docker-compose.yml`

Updated:
```bash
PAYMENT_GATEWAY_TOKEN=8f3A9cKpQ2Lw7ZxR6M4HnB5JdE
```

## Frontend Implementation

### API Configuration

**File:** `frontend/src/services/api.js`

The frontend has two different API clients:

1. **For Booking Operations** (through API Gateway):
```javascript
// Uses API Gateway at port 8080
const API_BASE_URL = 'http://localhost:8080';

paymentService.createTransaction(data)
// Calls: http://localhost:8080/api/payments/transaction/create
```

2. **For Payment Gateway Direct Calls**:
```javascript
// Direct to Payment Gateway at port 8089
const PAYMENT_GATEWAY_URL = 'http://localhost:8089/api';

// Get payment link directly
axios.post(`${PAYMENT_GATEWAY_URL}/pay/v2/${transactionId}?gateway=sandbox`)
```

### Required Frontend Updates

You need to add a direct payment gateway service in your frontend:

**File:** `frontend/src/services/api.js`

Add this:

```javascript
// Payment Gateway Direct API (bypasses API Gateway)
const PAYMENT_GATEWAY_URL = process.env.REACT_APP_PAYMENT_GATEWAY_URL || 'http://localhost:8089/api';

// Direct Payment Gateway Services (no auth required)
export const paymentGatewayDirect = {
  getPaymentDetailsV2: (transactionId, gateway = 'sandbox') =>
    axios.post(`${PAYMENT_GATEWAY_URL}/pay/v2/${transactionId}?gateway=${gateway}`),
  
  getPaymentLink: (transactionId, gateway = 'sandbox') =>
    axios.post(`${PAYMENT_GATEWAY_URL}/pay/${transactionId}?gateway=${gateway}`),
};
```

## Environment Variables

### Development

```bash
# API Gateway
REACT_APP_API_URL=http://localhost:8080

# Payment Gateway (direct access)
REACT_APP_PAYMENT_GATEWAY_URL=http://localhost:8089/api
```

### Production

```bash
# API Gateway
REACT_APP_API_URL=http://your-domain.com

# Payment Gateway (direct access)
REACT_APP_PAYMENT_GATEWAY_URL=http://payment.your-domain.com/api
```

## Testing the Flow

### 1. Start All Services

```bash
# Start infrastructure
docker-compose up -d postgres rabbitmq redis

# Start services
docker-compose up -d eureka-server api-gateway booking-service payment-gateway

# Or start them individually for development
```

### 2. Test Step-by-Step

#### Create Transaction (through API Gateway)

```bash
curl -X POST http://localhost:8080/api/payments/transaction/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_JWT_TOKEN" \
  -d '{
    "invoiceId": "TEST-12345",
    "amount": 100000,
    "mobileNumber": "09123456789",
    "email": "test@example.com",
    "callbackUrl": "http://localhost:3000/payment/callback",
    "description": "Test payment"
  }'
```

**Expected:** Returns `{ transactionId, invoiceId, createdAt }`

#### Get Payment Details (direct to payment gateway)

```bash
# Use transactionId from step 1
curl -X POST "http://localhost:8089/api/pay/v2/{transactionId}?gateway=sandbox"
```

**Expected:** Returns `{ payUrl, method, params, body }`

#### Complete Payment (sandbox)

Open in browser:
```
http://localhost:8089/api/sandbox/page?tid={transactionId}
```

Click "Complete Payment"

#### Verify Transaction (through booking service)

This happens automatically when frontend calls booking confirmation endpoint.

## Security Notes

### Authenticated Endpoints (require token `8f3A9cKpQ2Lw7ZxR6M4HnB5JdE`)

Used by **Booking Service** only:
- `POST /new` - Create transaction
- `GET /inquiry/{transactionId}` - Verify transaction

### Public Endpoints (no authentication)

Used by **Frontend** directly:
- `POST /pay/{transactionId}` - Get payment link (v1)
- `POST /pay/v2/{transactionId}` - Get payment details (v2)
- `GET/POST /verify/{transactionId}` - Verify payment callback
- `GET /sandbox/page` - Sandbox payment page

## Key Points

1. ✅ Frontend calls **API Gateway** for creating transactions
2. ✅ API Gateway forwards to **Booking Service**
3. ✅ Booking Service authenticates with **Payment Gateway** using token
4. ✅ Frontend calls **Payment Gateway DIRECTLY** (not through API Gateway) to get payment details
5. ✅ User completes payment on bank gateway
6. ✅ Frontend confirms booking with Booking Service
7. ✅ Booking Service verifies payment with Payment Gateway

## Common Issues

### Issue: 401 Unauthorized when creating transaction

**Solution:** Ensure booking service has the correct token configured:
```yaml
payment:
  gateway:
    token: 8f3A9cKpQ2Lw7ZxR6M4HnB5JdE
```

### Issue: 404 when frontend calls `/api/payments/transaction/create`

**Solution:** 
1. Check API Gateway is running on port 8080
2. Verify API Gateway route configuration
3. Restart API Gateway: `docker-compose restart api-gateway`

### Issue: Frontend can't reach payment gateway directly

**Solution:** 
1. Check payment gateway is running on port 8089
2. Verify CORS settings in payment gateway
3. Update frontend env: `REACT_APP_PAYMENT_GATEWAY_URL=http://localhost:8089/api`

### Issue: Payment gateway doesn't accept frontend requests

**Solution:** The payment endpoints `/pay/**` and `/verify/**` are public and don't require authentication. Check CORS configuration in payment gateway.

## Next Steps

1. **Restart API Gateway** to pick up the new route configuration
2. **Restart Booking Service** to use the new token
3. **Update Frontend** to include direct payment gateway calls
4. **Test the complete flow** using the steps above







