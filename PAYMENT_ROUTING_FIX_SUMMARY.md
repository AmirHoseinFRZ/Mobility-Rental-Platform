# Payment Routing Fix - Complete Summary

## Problem

The frontend was calling `http://172.20.202.53:8080/api/payments/transaction/create` but getting errors because:

1. The API Gateway was routing `/api/payments/**` to a non-existent `payment-service`
2. The actual payment endpoints are in the `booking-service` at `/api/bookings/payments/**`
3. The booking service needed the correct authentication token (`8f3A9cKpQ2Lw7ZxR6M4HnB5JdE`)

## Solution

### 1. Updated API Gateway Routing

**File:** `backend/api-gateway/src/main/resources/application.yml`

**Changed:**
```yaml
# OLD - routed to non-existent payment-service
- id: payment-service
  uri: lb://payment-service
  predicates:
    - Path=/api/payments/**
```

**To:**
```yaml
# NEW - routes to booking-service with path rewrite
- id: payment-routes
  uri: lb://booking-service
  predicates:
    - Path=/api/payments/**
  filters:
    - RewritePath=/api/payments/(?<segment>.*), /api/bookings/payments/$\{segment}
```

**What this does:**
- Receives: `http://api-gateway:8080/api/payments/transaction/create`
- Rewrites to: `/api/bookings/payments/transaction/create`
- Forwards to: `booking-service`

### 2. Updated Authentication Token

**Files Updated:**
- `backend/booking-service/src/main/resources/application.yml`
- `infrastructure/docker/postgres/init-payment-gateway-db.sql`
- `env.example`
- `docker-compose.yml`

**Changed token from:**
```
mobility-platform-token-2024-secure-key
```

**To:**
```
8f3A9cKpQ2Lw7ZxR6M4HnB5JdE
```

This token already exists in the database associated with the `mobility-platform` client.

### 3. Updated Frontend API Service

**File:** `frontend/src/services/api.js`

**Added:**
- `PAYMENT_GATEWAY_URL` constant for direct payment gateway access
- `paymentGatewayDirect` service for calling payment gateway directly
- Enhanced `paymentService` with transaction status endpoint

## Complete Payment Flow (After Fix)

```
┌─────────┐
│ Step 1  │ User clicks "Pay" button
└────┬────┘
     │
┌────▼────────────────────────────────────────────────────────┐
│ Step 2: Frontend → API Gateway → Booking Service            │
│         POST /api/payments/transaction/create                │
│         (API Gateway rewrites path and forwards)             │
└────┬────────────────────────────────────────────────────────┘
     │
┌────▼────────────────────────────────────────────────────────┐
│ Step 3: Booking Service → Payment Gateway                   │
│         POST /new (with token: 8f3A9cKpQ2Lw7ZxR6M4HnB5JdE)  │
│         Returns: { transactionId, invoiceId, createdAt }    │
└────┬────────────────────────────────────────────────────────┘
     │
┌────▼────────────────────────────────────────────────────────┐
│ Step 4: Frontend → Payment Gateway (DIRECT, no API Gateway) │
│         POST /pay/v2/{transactionId}?gateway=sandbox         │
│         Returns: { payUrl, method, params, body }            │
└────┬────────────────────────────────────────────────────────┘
     │
┌────▼────────────────────────────────────────────────────────┐
│ Step 5: Frontend redirects user to payUrl                   │
└────┬────────────────────────────────────────────────────────┘
     │
┌────▼────────────────────────────────────────────────────────┐
│ Step 6: User completes payment on bank gateway              │
└────┬────────────────────────────────────────────────────────┘
     │
┌────▼────────────────────────────────────────────────────────┐
│ Step 7: Bank Gateway → Payment Gateway                      │
│         POST /verify/{transactionId}                         │
│         Redirects to callback URL                            │
└────┬────────────────────────────────────────────────────────┘
     │
┌────▼────────────────────────────────────────────────────────┐
│ Step 8: Frontend → API Gateway → Booking Service            │
│         POST /api/bookings/{bookingId}/confirm               │
└────┬────────────────────────────────────────────────────────┘
     │
┌────▼────────────────────────────────────────────────────────┐
│ Step 9: Booking Service → Payment Gateway                   │
│         GET /inquiry/{transactionId}                         │
│         (with token to verify payment)                       │
└────┬────────────────────────────────────────────────────────┘
     │
┌────▼────────────────────────────────────────────────────────┐
│ Step 10: Booking confirmed if payment successful            │
└─────────────────────────────────────────────────────────────┘
```

## Files Changed

### Backend

1. **API Gateway Configuration**
   - `backend/api-gateway/src/main/resources/application.yml`
   - Added payment route with path rewrite

2. **Booking Service Configuration**
   - `backend/booking-service/src/main/resources/application.yml`
   - Updated payment gateway token

3. **Database Initialization**
   - `infrastructure/docker/postgres/init-payment-gateway-db.sql`
   - Updated default token

### Configuration

4. **Environment Example**
   - `env.example`
   - Updated PAYMENT_GATEWAY_TOKEN

5. **Docker Compose**
   - `docker-compose.yml`
   - Updated booking service environment variable

### Frontend

6. **API Service**
   - `frontend/src/services/api.js`
   - Added PAYMENT_GATEWAY_URL constant
   - Added paymentGatewayDirect service
   - Enhanced paymentService

### Documentation

7. **New Documentation Files**
   - `CORRECT_PAYMENT_FLOW.md` - Complete flow documentation
   - `PAYMENT_ROUTING_FIX_SUMMARY.md` - This file
   - `PAYMENT_FIX_SUMMARY.md` - Token fix summary
   - `PAYMENT_FLOW_UPDATED.md` - Updated API documentation

## How to Apply the Fix

### Step 1: Restart API Gateway

The API Gateway needs to be restarted to pick up the new routing configuration.

```bash
# If using Docker
docker-compose restart api-gateway

# If running standalone
cd backend/api-gateway
./mvnw spring-boot:run
```

### Step 2: Restart Booking Service

The booking service needs to be restarted to use the new token.

```bash
# If using Docker
docker-compose restart booking-service

# If running standalone
cd backend/booking-service
./mvnw spring-boot:run
```

### Step 3: Update Frontend Environment (if needed)

If you have a `.env` file in the frontend:

```bash
# frontend/.env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_PAYMENT_GATEWAY_URL=http://localhost:8089/api
```

### Step 4: Restart Frontend (if running)

```bash
cd frontend
npm start
```

## Testing the Fix

### Test 1: Create Transaction through API Gateway

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

**Expected Result:**
```json
{
  "transactionId": "550e8400-e29b-41d4-a716-446655440001",
  "invoiceId": "TEST-12345",
  "createdAt": "2024-01-06T10:30:00"
}
```

**Should NOT get 401 or 404 errors**

### Test 2: Get Payment Details (Direct Call)

```bash
# Use transactionId from Test 1
curl -X POST "http://localhost:8089/api/pay/v2/550e8400-e29b-41d4-a716-446655440001?gateway=sandbox"
```

**Expected Result:**
```json
{
  "payUrl": "http://localhost:8089/api/sandbox/page?tid=550e8400-e29b-41d4-a716-446655440001",
  "method": "POST",
  "params": {},
  "body": ""
}
```

### Test 3: Complete Payment (Sandbox)

Open in browser:
```
http://localhost:8089/api/sandbox/page?tid=550e8400-e29b-41d4-a716-446655440001
```

Click "Complete Payment" - should redirect to your callback URL.

## Verify API Gateway Routing

To check that API Gateway is correctly routing requests:

```bash
# Check API Gateway logs
docker logs api-gateway -f

# You should see logs showing:
# - Incoming request: /api/payments/transaction/create
# - Rewritten to: /api/bookings/payments/transaction/create
# - Forwarded to: booking-service
```

## Environment Variables Summary

### Booking Service
```bash
PAYMENT_GATEWAY_URL=http://payment-gateway:8089/api
PAYMENT_GATEWAY_TOKEN=8f3A9cKpQ2Lw7ZxR6M4HnB5JdE
```

### Frontend
```bash
REACT_APP_API_URL=http://localhost:8080
REACT_APP_PAYMENT_GATEWAY_URL=http://localhost:8089/api
```

## Frontend Usage Example

```javascript
import { paymentService, paymentGatewayDirect } from './services/api';

// Step 1: Create transaction (through API Gateway)
const createPayment = async (bookingData) => {
  try {
    const transactionResponse = await paymentService.createTransaction({
      invoiceId: `BOOKING-${bookingData.id}`,
      amount: bookingData.totalPrice * 100, // Convert to smallest unit
      mobileNumber: bookingData.userPhone,
      email: bookingData.userEmail,
      callbackUrl: `${window.location.origin}/payment/callback`,
      description: `Payment for booking ${bookingData.id}`
    });
    
    return transactionResponse.transactionId;
  } catch (error) {
    console.error('Failed to create transaction:', error);
    throw error;
  }
};

// Step 2: Get payment link (direct to payment gateway)
const getPaymentDetails = async (transactionId) => {
  try {
    const paymentDetails = await paymentGatewayDirect.getPaymentDetailsV2(
      transactionId,
      'sandbox' // or 'pasargad', 'sep', etc.
    );
    
    // paymentDetails contains: { payUrl, method, params, body }
    return paymentDetails;
  } catch (error) {
    console.error('Failed to get payment details:', error);
    throw error;
  }
};

// Step 3: Redirect to payment
const redirectToPayment = (paymentDetails) => {
  const form = document.createElement('form');
  form.method = paymentDetails.method;
  form.action = paymentDetails.payUrl;
  
  // Add params as hidden inputs
  Object.entries(paymentDetails.params || {}).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });
  
  document.body.appendChild(form);
  form.submit();
};
```

## Troubleshooting

### Issue: Still getting 401 when creating transaction

**Check:**
1. Booking service is using the correct token
2. Token exists in database
3. Booking service can reach payment gateway

**Verify:**
```bash
# Check booking service logs
docker logs booking-service -f

# Check payment gateway client token in booking service
docker exec booking-service env | grep PAYMENT_GATEWAY_TOKEN
```

### Issue: 404 when calling /api/payments/transaction/create

**Check:**
1. API Gateway is running
2. API Gateway has the new route configuration
3. Booking service is registered with Eureka

**Verify:**
```bash
# Check API Gateway routes
curl http://localhost:8080/actuator/gateway/routes | jq

# Should see payment-routes with path /api/payments/**
```

### Issue: Frontend can't reach payment gateway directly

**Check:**
1. Payment gateway is running on port 8089
2. CORS is enabled in payment gateway
3. Frontend has correct PAYMENT_GATEWAY_URL

**Verify:**
```bash
# Test direct access
curl http://localhost:8089/api/gateway/all

# Should return list of available gateways
```

## Key Points to Remember

1. ✅ **Frontend calls API Gateway** for creating transactions
2. ✅ **API Gateway rewrites and forwards** to booking service
3. ✅ **Booking service authenticates** with payment gateway using token
4. ✅ **Frontend calls payment gateway DIRECTLY** for payment details
5. ✅ **No authentication needed** for /pay and /verify endpoints
6. ✅ **Booking service verifies** payment before confirming booking

## Next Steps

1. ✅ Restart API Gateway and Booking Service
2. ✅ Test the create transaction endpoint
3. ✅ Test the complete payment flow
4. ✅ Update frontend to use the new paymentGatewayDirect service
5. ✅ Deploy to production with correct environment variables

## Support

For more details, see:
- `CORRECT_PAYMENT_FLOW.md` - Complete flow documentation
- `PAYMENT_FIX_SUMMARY.md` - Authentication fix details
- `PAYMENT_FLOW_UPDATED.md` - API reference







