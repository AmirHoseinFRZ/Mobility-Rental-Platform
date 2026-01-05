# Payment Gateway Quick Start Guide

## Problem
You're getting a 503 error when trying to create a payment transaction at:
```
http://172.20.202.53:8080/api/payments/transaction/create
```

This is because the payment gateway service is not running.

## Solution

The payment gateway has been integrated into your project. Here's how to start it:

### Option 1: Using Docker Compose (Recommended)

The payment gateway is already configured in docker-compose.yml. Simply start it with:

```bash
cd /home/amirhosein/IdeaProjects/Mobility-Rental-Platform

# Build and start the payment gateway
docker-compose build payment-gateway
docker-compose up -d payment-gateway

# Check if it's running
docker-compose ps payment-gateway
docker-compose logs -f payment-gateway
```

### Option 2: Using the Startup Script

```bash
cd /home/amirhosein/IdeaProjects/Mobility-Rental-Platform

# Start the payment gateway
./scripts/start-payment-gateway.sh

# Check logs
tail -f logs/payment-gateway.log

# Stop when needed
./scripts/stop-payment-gateway.sh
```

### Option 3: Manual Start (Development)

```bash
cd /home/amirhosein/IdeaProjects/Mobility-Rental-Platform/backend/internal-payment-gateway

# Set Java 21
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

# Build (if not already built)
./mvnw clean package -DskipTests

# Set environment variables
export SERVER_PORT=8089
export SPRING_PROFILES_ACTIVE=local
export DB_PAYMENT="jdbc:postgresql://localhost:5432/mobility_platform?currentSchema=ipg"
export SECRETS_DBUSER="mobility_user"
export SECRETS_DBPASS="mobility_password"
export AMQ_HOST="localhost"
export SECRETS_AMQUSER="mobility_user"
export SECRETS_AMQPASS="mobility_password"

# Run
java -jar target/internal-payment-gateway-*.jar
```

## Verify It's Working

Once started, verify the payment gateway is running:

```bash
# Health check
curl http://localhost:8089/api/actuator/health

# Should return something like:
# {"status":"UP"}
```

## Test the Payment Flow

### 1. Create a Payment Transaction

```bash
curl -X POST http://localhost:8089/api/new \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mobility-platform-token-2024-secure-key" \
  -d '{
    "invoiceId": "TEST-12345",
    "amount": 100000,
    "mobileNumber": "09123456789",
    "email": "test@example.com",
    "callbackUrl": "http://localhost:3000/payment/callback",
    "description": "Test payment"
  }'
```

This will return a transaction ID like:
```json
{
  "transactionId": "550e8400-e29b-41d4-a716-446655440001",
  "invoiceId": "TEST-12345",
  "amount": 100000,
  "status": "PENDING"
}
```

### 2. Get Payment Link (Sandbox)

```bash
curl -X POST "http://localhost:8089/api/pay/{transactionId}?gateway=sandbox"
```

This returns:
```json
{
  "paymentUrl": "http://localhost:8089/api/sandbox/page?tid={transactionId}",
  "transactionId": "550e8400-e29b-41d4-a716-446655440001",
  "gatewaySlug": "sandbox"
}
```

### 3. Complete Payment

Open the payment URL in a browser:
```
http://localhost:8089/api/sandbox/page?tid={transactionId}
```

Click "Complete Payment" to simulate a successful payment.

## Integration with Booking Service

The booking service now has payment endpoints at:

```
http://localhost:8083/api/bookings/payments/transaction/create
http://localhost:8083/api/bookings/payments/transaction/{id}/pay
http://localhost:8083/api/bookings/payments/transaction/{id}/status
```

These endpoints proxy to the payment gateway with proper authentication.

## Troubleshooting

### Payment Gateway Won't Start

1. **Check if port 8089 is available:**
   ```bash
   lsof -i :8089
   ```

2. **Check database connection:**
   ```bash
   docker exec -it mobility-postgres psql -U mobility_user -d mobility_platform -c "\dt ipg.*"
   ```
   
   Should show tables like:
   - ipg.client
   - ipg.client_token
   - ipg.transaction
   - ipg.transaction_audit

3. **Check RabbitMQ connection:**
   ```bash
   docker-compose ps rabbitmq
   ```

### Still Getting 503 Error

1. **Verify payment gateway is accessible:**
   ```bash
   curl http://localhost:8089/api/actuator/health
   ```

2. **Check booking service can reach payment gateway:**
   ```bash
   docker exec mobility-booking-service curl http://payment-gateway:8089/api/actuator/health
   ```

3. **Check environment variables in booking service:**
   ```bash
   docker exec mobility-booking-service env | grep PAYMENT
   ```
   
   Should show:
   ```
   PAYMENT_GATEWAY_URL=http://payment-gateway:8089/api
   PAYMENT_GATEWAY_TOKEN=mobility-platform-token-2024-secure-key
   ```

### Database Not Initialized

If the ipg schema doesn't exist:

```bash
docker exec -i mobility-postgres psql -U mobility_user -d mobility_platform < infrastructure/docker/postgres/init-payment-gateway-db.sql
```

## Configuration Files Changed

The following files have been modified/created:

1. **`.gitignore`** - Added `backend/internal-payment-gateway/` to ignore list
2. **`docker-compose.yml`** - Added payment-gateway service
3. **`infrastructure/docker/postgres/init-payment-gateway-db.sql`** - Database schema
4. **`backend/internal-payment-gateway/Dockerfile`** - Docker build configuration
5. **`backend/booking-service/src/main/resources/application.yml`** - Added payment config
6. **`backend/booking-service/src/main/java/com/mobility/platform/booking/`** - New payment classes:
   - `client/PaymentGatewayClient.java`
   - `controller/PaymentController.java`
   - `service/PaymentService.java`
   - `dto/PaymentTransactionRequest.java`
   - `dto/PaymentTransactionResponse.java`
   - `dto/PaymentLinkResponse.java`

## Next Steps

1. Start the payment gateway using one of the methods above
2. Rebuild and restart the booking service to pick up the new payment endpoints
3. Test the payment flow using the sandbox gateway
4. Update your frontend to use the new payment endpoints

## Production Considerations

For production deployment:

1. Change `SPRING_PROFILES_ACTIVE` to `production`
2. Configure real bank gateway credentials
3. Update callback URLs to production URLs
4. Enable SSL/TLS
5. Set up monitoring and alerting
6. Review security settings

## Support

For detailed documentation, see:
- `PAYMENT_GATEWAY_SETUP.md` - Complete setup guide
- Payment gateway source code (if available)
- Bank gateway documentation

