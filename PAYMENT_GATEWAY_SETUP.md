# Payment Gateway Integration Guide

This guide explains how the internal payment gateway has been integrated into the Mobility Rental Platform.

## Overview

The internal payment gateway (`internal-payment-gateway`) is a standalone Spring Boot application that provides payment processing capabilities using various Iranian bank gateways and a sandbox mode for testing.

## Architecture

### Components

1. **Payment Gateway Service** (Port 8089)
   - Handles payment transaction creation
   - Manages payment workflows
   - Supports multiple bank gateways (Pasargad, SEP, Behpardakht, Saderat)
   - Provides sandbox mode for testing

2. **Booking Service Integration**
   - New payment endpoints in booking service
   - Payment client for gateway communication
   - Transaction tracking in bookings

### Database Schema

The payment gateway uses its own schema (`ipg`) in the PostgreSQL database with the following tables:

- `ipg.client` - Payment gateway clients/applications
- `ipg.client_token` - Authentication tokens for clients
- `ipg.transaction` - Payment transactions
- `ipg.transaction_audit` - Audit log for transactions
- `ipg.http_log` - HTTP request/response logs for debugging

## Configuration

### Environment Variables

The following environment variables are required:

```bash
# Payment Gateway Configuration
PAYMENT_GATEWAY_URL=http://payment-gateway:8089/api
PAYMENT_GATEWAY_TOKEN=mobility-platform-token-2024-secure-key

# Database (for payment gateway)
DB_PAYMENT=jdbc:postgresql://postgres:5432/mobility_platform?currentSchema=ipg
SECRETS_DBUSER=mobility_user
SECRETS_DBPASS=mobility_password

# RabbitMQ (for payment gateway)
AMQ_HOST=rabbitmq
SECRETS_AMQUSER=mobility_user
SECRETS_AMQPASS=mobility_password
```

### Default Client Credentials

A default client is automatically created during database initialization:

- **Client ID**: `550e8400-e29b-41d4-a716-446655440000`
- **Client Slug**: `mobility-platform`
- **Token**: `mobility-platform-token-2024-secure-key`

## API Endpoints

### Payment Gateway Endpoints

Base URL: `http://localhost:8089/api`

#### Create Transaction
```http
POST /new
Authorization: Bearer mobility-platform-token-2024-secure-key
Content-Type: application/json

{
  "invoiceId": "BOOKING-12345",
  "amount": 100000,
  "mobileNumber": "09123456789",
  "email": "user@example.com",
  "callbackUrl": "http://localhost:3000/payment/callback",
  "description": "Payment for booking #12345"
}
```

#### Get Payment Link
```http
POST /pay/{transactionId}?gateway=sandbox
```

#### Verify Transaction
```http
GET/POST /verify/{transactionId}
```

#### Inquiry Transaction
```http
GET /inquiry/{transactionId}
Authorization: Bearer mobility-platform-token-2024-secure-key
```

### Booking Service Payment Endpoints

Base URL: `http://localhost:8083/api/bookings/payments`

#### Create Payment Transaction
```http
POST /transaction/create
Content-Type: application/json

{
  "invoiceId": "BOOKING-12345",
  "amount": 100000,
  "mobileNumber": "09123456789",
  "email": "user@example.com",
  "callbackUrl": "http://localhost:3000/payment/callback",
  "description": "Payment for booking #12345"
}
```

#### Get Payment Link
```http
POST /transaction/{transactionId}/pay
```

#### Get Transaction Status
```http
GET /transaction/{transactionId}/status
```

#### Get Payment by Booking ID
```http
GET /transaction/booking/{bookingId}
```

## Sandbox Mode

The payment gateway includes a sandbox mode for testing without real bank integration.

### Using Sandbox

1. Create a transaction using the API
2. Get the payment link with `gateway=sandbox` parameter
3. Access the sandbox page: `http://localhost:8089/api/sandbox/page?tid={transactionId}`
4. The sandbox page simulates a bank payment gateway
5. After "payment", you'll be redirected to the callback URL

### Sandbox Features

- No real money transactions
- Instant payment confirmation
- Useful for development and testing
- Enabled in `local` and `test` profiles

## Running the Payment Gateway

### With Docker Compose

The payment gateway is included in the docker-compose configuration:

```bash
# Start all services including payment gateway
docker-compose --profile backend up -d

# Start only payment gateway
docker-compose up -d payment-gateway
```

### Standalone (Development)

```bash
# Using the provided script
./scripts/start-payment-gateway.sh

# Or manually
cd backend/internal-payment-gateway
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

### Stop Payment Gateway

```bash
./scripts/stop-payment-gateway.sh
```

## Integration Flow

### Payment Flow Diagram

```
User → Frontend → Booking Service → Payment Gateway → Bank Gateway
                                           ↓
                                      Database (ipg schema)
                                           ↓
                                      Callback URL
                                           ↓
                                      Frontend (Payment Result)
```

### Step-by-Step Flow

1. **Create Booking**: User creates a booking in the frontend
2. **Initiate Payment**: Frontend calls `/payments/transaction/create` with booking details
3. **Get Payment Link**: Frontend calls `/payments/transaction/{id}/pay` to get payment URL
4. **Redirect to Gateway**: User is redirected to payment gateway (sandbox or real bank)
5. **Complete Payment**: User completes payment on gateway page
6. **Callback**: Gateway redirects back to callback URL with transaction result
7. **Verify Payment**: Frontend verifies payment status
8. **Update Booking**: Booking status is updated based on payment result

## Database Schema

The payment gateway database schema is automatically created by the init script:

```sql
-- Schema: ipg
-- Tables:
--   - client (payment clients)
--   - client_token (authentication tokens)
--   - transaction (payment transactions)
--   - transaction_audit (audit trail)
--   - http_log (request/response logs)
--   - revision_info (audit metadata)
--   - uuid_mapping (UUID to ID mapping)
```

## Troubleshooting

### Payment Gateway Not Starting

1. Check if PostgreSQL is running
2. Check if RabbitMQ is running
3. Verify database schema is created: `psql -U mobility_user -d mobility_platform -c "\dt ipg.*"`
4. Check logs: `tail -f logs/payment-gateway.log`

### 503 Service Unavailable

This error occurs when the payment gateway is not running or not accessible:

1. Verify payment gateway is running: `curl http://localhost:8089/api/actuator/health`
2. Check docker network connectivity if using Docker
3. Verify environment variables are set correctly
4. Check firewall rules

### Authentication Errors

1. Verify the token matches in both services
2. Check `ipg.client_token` table for valid tokens
3. Ensure Bearer token is included in request headers

### Database Connection Issues

1. Verify database credentials
2. Check if `ipg` schema exists
3. Run the init script manually if needed:
   ```bash
   psql -U mobility_user -d mobility_platform -f infrastructure/docker/postgres/init-payment-gateway-db.sql
   ```

## Security Considerations

1. **Token Management**: Keep the payment gateway token secure
2. **HTTPS**: Use HTTPS in production for all payment-related endpoints
3. **Callback URLs**: Validate callback URLs to prevent redirect attacks
4. **Database Access**: Restrict database access to payment gateway service only
5. **Audit Logs**: Review audit logs regularly for suspicious activity

## Production Deployment

### Configuration Changes

1. Change `SPRING_PROFILES_ACTIVE` to `production`
2. Update bank gateway credentials
3. Enable desired bank gateways (Pasargad, SEP, Behpardakht, Saderat)
4. Configure proper callback URLs
5. Set up SSL/TLS certificates
6. Configure monitoring and alerting

### Bank Gateway Setup

Each bank gateway requires:
- Terminal number
- Merchant ID
- Username/Password
- Gateway URLs
- SSL certificates (if required)

Refer to each bank's documentation for specific setup instructions.

## Monitoring

### Health Checks

- Payment Gateway: `http://localhost:8089/api/actuator/health`
- Metrics: `http://localhost:8089/api/actuator/metrics`
- Prometheus: `http://localhost:8089/api/actuator/prometheus`

### Logs

- Application logs: `logs/payment-gateway.log`
- HTTP logs: Stored in `ipg.http_log` table
- Audit logs: Stored in `ipg.transaction_audit` table

## Support

For issues or questions:
1. Check the logs first
2. Review this documentation
3. Check the payment gateway source code
4. Contact the development team

## Git Ignore

The `backend/internal-payment-gateway/` directory is added to `.gitignore` as requested. This prevents the payment gateway code from being committed to the repository.

To update the payment gateway:
1. Replace the directory with the new version
2. Restart the service
3. Run database migrations if needed

