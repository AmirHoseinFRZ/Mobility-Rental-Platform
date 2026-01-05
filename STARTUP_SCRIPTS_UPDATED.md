# Startup Scripts Updated - Payment Gateway Integration

## What Was Updated

The payment gateway service has been added to the startup and shutdown scripts so it starts automatically with all other services.

## Updated Scripts

### 1. Linux/Mac Scripts

#### `start-all.sh`
✅ Added Payment Gateway startup after all other services
✅ Configured environment variables:
- `SPRING_PROFILES_ACTIVE=local`
- `DB_PAYMENT` - PostgreSQL connection to ipg schema
- `SECRETS_DBUSER` and `SECRETS_DBPASS` - Database credentials
- `AMQ_HOST`, `SECRETS_AMQUSER`, `SECRETS_AMQPASS` - RabbitMQ configuration
✅ Uses Java 21 if available (required for payment gateway)
✅ Starts on port 8089
✅ Logs to `logs/payment-gateway.log`
✅ PID saved to `logs/payment-gateway.pid`
✅ Added to service URLs list in output

#### `stop-all.sh`
✅ Payment gateway will be stopped automatically by existing PID file cleanup
✅ Added specific cleanup for internal-payment-gateway process

### 2. Windows PowerShell Scripts

#### `start-all.ps1`
✅ Added Payment Gateway to services array
✅ Opens in separate PowerShell window on port 8089
✅ Path: `backend\internal-payment-gateway`
✅ Added to service URLs list in output

#### `stop-all.ps1`
✅ Payment gateway will be stopped automatically with other Java processes (no changes needed)

## How to Use

### Linux/Mac

**Start all services including payment gateway:**
```bash
./start-all.sh
```

**Stop all services:**
```bash
./stop-all.sh
```

### Windows

**Start all services including payment gateway:**
```powershell
.\start-all.ps1
```

**Stop all services:**
```powershell
.\stop-all.ps1
```

## What Happens When You Run start-all.sh

The script now:

1. ✅ Checks prerequisites (Docker, Java, Maven, Node.js)
2. ✅ Creates environment files
3. ✅ Starts infrastructure (PostgreSQL, RabbitMQ, Redis)
4. ✅ Builds all backend services
5. ✅ Starts Eureka Server (8761)
6. ✅ Starts all microservices (8080-8088)
7. ✅ **Starts Payment Gateway (8089)** ← NEW!
8. ✅ Installs frontend dependencies
9. ✅ Starts frontend (3000)

## Service URLs After Startup

When `start-all.sh` completes, you'll see:

```
Frontend Application:
  ➜ http://localhost:3000

Service Discovery:
  ➜ Eureka Server:   http://localhost:8761

API Gateway:
  ➜ http://localhost:8080

Infrastructure:
  ➜ PostgreSQL:      localhost:5432
  ➜ RabbitMQ Admin:  http://localhost:15672 (user: mobility_user, pass: mobility_password)
  ➜ Redis:           localhost:6379

Backend Services:
  ➜ User Service:        http://localhost:8081
  ➜ Vehicle Service:     http://localhost:8082
  ➜ Booking Service:     http://localhost:8083
  ➜ Pricing Service:     http://localhost:8084
  ➜ Driver Service:      http://localhost:8085
  ➜ Review Service:      http://localhost:8086
  ➜ Location Service:    http://localhost:8087
  ➜ Maintenance Service: http://localhost:8088
  ➜ Payment Gateway:     http://localhost:8089/api ← NEW!
```

## Verification

After running `start-all.sh`, verify the payment gateway is running:

```bash
# Check if process is running
ps aux | grep payment-gateway

# Check the log
tail -f logs/payment-gateway.log

# Test the health endpoint
curl http://localhost:8089/api/actuator/health
```

Expected response:
```json
{"status":"UP"}
```

## Troubleshooting

### Payment Gateway Fails to Start

If the payment gateway fails to start:

1. **Check Java version:**
   ```bash
   java -version
   # Should be Java 21
   ```

2. **Check the log:**
   ```bash
   tail -100 logs/payment-gateway.log
   ```

3. **Verify database is initialized:**
   ```bash
   docker exec -it mobility-postgres psql -U mobility_user -d mobility_platform -c "\dt ipg.*"
   ```

4. **Try starting manually:**
   ```bash
   ./scripts/start-payment-gateway.sh
   ```

### Payment Gateway Directory Not Found

If you see "Payment Gateway directory not found, skipping...":

- This means the `backend/internal-payment-gateway` directory doesn't exist
- The script will continue without it (no error)
- This is expected if you're running without the payment gateway code

## Manual Control

You can still start/stop the payment gateway independently:

```bash
# Start only payment gateway
./scripts/start-payment-gateway.sh

# Stop only payment gateway
./scripts/stop-payment-gateway.sh
```

## Logs Location

All service logs are in the `logs/` directory:

- `logs/payment-gateway.log` - Payment gateway application log
- `logs/payment-gateway.pid` - Process ID file
- `logs/eureka-server.log` - Eureka server log
- `logs/api-gateway.log` - API gateway log
- ... (other service logs)

## Next Steps

1. ✅ Payment gateway is now part of your standard startup routine
2. ✅ It will start automatically when you run `./start-all.sh`
3. ✅ It will stop automatically when you run `./stop-all.sh`
4. ✅ No manual intervention needed for normal operations

## Summary

✅ **Linux/Mac Scripts**: Updated `start-all.sh` and `stop-all.sh`
✅ **Windows Scripts**: Updated `start-all.ps1` and `stop-all.ps1`
✅ **Payment Gateway**: Starts on port 8089
✅ **Environment**: Configured for local development
✅ **Logs**: Available in `logs/payment-gateway.log`
✅ **Process Management**: PID file in `logs/payment-gateway.pid`

The payment gateway is now fully integrated into your startup workflow!

