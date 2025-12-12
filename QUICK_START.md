# Mobility Rental Platform - Quick Start Guide

## 🚀 Get Up and Running in 10 Minutes

This guide will get you from zero to a fully functional platform as quickly as possible.

---

## Prerequisites

- ✅ Docker Desktop installed and running
- ✅ JDK 17+ installed
- ✅ Maven 3.9+ installed
- ✅ Node.js 18+ installed
- ✅ Git installed

**Check your setup:**
```bash
docker --version          # Should be 24.0+
java -version            # Should be 17+
mvn -version             # Should be 3.9+
node --version           # Should be 18+
```

---

## Step-by-Step Deployment

### Step 1: Clone Repository (1 minute)

```bash
git clone https://github.com/AmirHoseinFRZ/Mobility-Rental-Platform.git
cd Mobility-Rental-Platform
```

### Step 2: Start Infrastructure (2 minutes)

```bash
# Start PostgreSQL, RabbitMQ, Redis
docker-compose up -d

# Wait for services to be ready (check with)
docker ps

# You should see:
# - mobility-postgres (port 5432)
# - mobility-rabbitmq (ports 5672, 15672)
# - mobility-redis (port 6379)
```

**Verify infrastructure:**
```bash
# Check PostgreSQL
docker exec mobility-postgres pg_isready -U mobility_user

# Check RabbitMQ
curl http://localhost:15672  # Should see login page

# Check Redis
docker exec mobility-redis redis-cli ping  # Should return PONG
```

### Step 3: Build Backend (3 minutes)

```bash
cd backend
mvn clean install -DskipTests

# This compiles all 10 microservices
# Coffee break! ☕
```

### Step 4: Start Backend Services (2 minutes)

**Open 9 terminal windows and run:**

```bash
# Terminal 1 - API Gateway (REQUIRED FIRST!)
cd backend/api-gateway && mvn spring-boot:run

# Terminal 2 - User Service
cd backend/user-service && mvn spring-boot:run

# Terminal 3 - Vehicle Service
cd backend/vehicle-service && mvn spring-boot:run

# Terminal 4 - Booking Service
cd backend/booking-service && mvn spring-boot:run

# Terminal 5 - Pricing Service
cd backend/pricing-service && mvn spring-boot:run

# Terminal 6 - Driver Service
cd backend/driver-service && mvn spring-boot:run

# Terminal 7 - Review Service
cd backend/review-service && mvn spring-boot:run

# Terminal 8 - Location Service (Optional)
cd backend/location-service && mvn spring-boot:run

# Terminal 9 - Maintenance Service (Optional)
cd backend/maintenance-service && mvn spring-boot:run
```

**Wait for all services to start** (look for "Started [Service]Application")

### Step 5: Start Frontend (2 minutes)

```bash
# New terminal
cd frontend
npm install
npm start
```

**Frontend will open automatically at http://localhost:3000**

---

## ✅ Verify Everything is Working

### 1. Check Backend Services

Visit these URLs in your browser:

- ✅ API Gateway: http://localhost:8080/actuator/health
- ✅ User Service: http://localhost:8081/api/users/swagger-ui.html
- ✅ Vehicle Service: http://localhost:8082/api/vehicles/swagger-ui.html
- ✅ Booking Service: http://localhost:8083/api/bookings/swagger-ui.html
- ✅ Pricing Service: http://localhost:8084/api/pricing/swagger-ui.html
- ✅ Driver Service: http://localhost:8085/api/drivers/swagger-ui.html
- ✅ Review Service: http://localhost:8086/api/reviews/swagger-ui.html

All should show Swagger UI or health status.

### 2. Check Infrastructure

- ✅ RabbitMQ UI: http://localhost:15672
  - Login: `mobility_user` / `mobility_password`
  - Should see exchanges and queues

### 3. Check Frontend

- ✅ Frontend: http://localhost:3000
  - Should see landing page
  - Navigation works
  - Can access login/register pages

---

## 🧪 Test the Platform (5 minutes)

### Test Flow 1: User Registration

1. Go to http://localhost:3000
2. Click "Sign Up"
3. Fill in the form:
   ```
   Email: test@example.com
   Password: password123
   First Name: John
   Last Name: Doe
   Phone: +1234567890
   ```
4. Submit → Should redirect to search page
5. Check terminal: User Service should log "User registered successfully"

### Test Flow 2: Create a Test Vehicle

Use Swagger UI or curl:

```bash
curl -X POST http://localhost:8080/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleNumber": "TEST-001",
    "brand": "Toyota",
    "model": "Camry",
    "year": 2024,
    "vehicleType": "CAR",
    "seatingCapacity": 5,
    "pricePerHour": 15.00,
    "pricePerDay": 100.00,
    "latitude": 40.7128,
    "longitude": -74.0060,
    "currentCity": "New York",
    "fuelType": "HYBRID",
    "transmission": "AUTOMATIC"
  }'
```

### Test Flow 3: Search Vehicles

1. Go to http://localhost:3000/search
2. Enter coordinates:
   - Latitude: `40.7128`
   - Longitude: `-74.0060`
   - Radius: `10` km
3. Click "Search"
4. Should see the test vehicle you created!

### Test Flow 4: Create Booking

1. Click on a vehicle
2. Click "Book Now"
3. Select dates
4. Click "Proceed to Payment"
5. Payment page should load
6. Click "Pay $XX.XX"
7. Should create transaction

### Test Flow 5: View Bookings

1. Click "My Bookings" in navigation
2. Should see your booking
3. Status should be "PENDING"

---

## 🎯 What to Do Next

### For Development

1. **Explore APIs** - Use Swagger UI for each service
2. **Check Logs** - Monitor terminal outputs
3. **Test Features** - Try all user flows
4. **Read Documentation** - Check README files

### For Production

1. **Follow DEPLOYMENT_GUIDE.md** - Complete deployment instructions
2. **Connect Payment Gateway** - Integrate your payment service
3. **Setup Monitoring** - Prometheus + Grafana
4. **Configure SSL** - HTTPS certificates
5. **Deploy to Cloud** - AWS/Azure/GCP

---

## 🛑 How to Stop Everything

### Stop Frontend

```bash
# In frontend terminal, press Ctrl+C
```

### Stop Backend Services

```bash
# In each backend service terminal, press Ctrl+C
```

### Stop Infrastructure

```bash
# Stop Docker containers
docker-compose down

# To remove all data (WARNING: Deletes databases!)
docker-compose down -v
```

---

## 🐛 Troubleshooting Quick Fixes

### "Port already in use"

```bash
# Find process using port
lsof -i :8081  # or netstat -ano | findstr :8081 on Windows

# Kill process
kill -9 <PID>
```

### "Cannot connect to database"

```bash
# Restart PostgreSQL
docker restart mobility-postgres

# Check if database exists
docker exec -it mobility-postgres psql -U mobility_user -l
```

### "Service won't start"

```bash
# Check if previous build artifacts exist
cd backend
mvn clean

# Rebuild
mvn install -DskipTests
```

### "Frontend shows API error"

```bash
# Check if API Gateway is running
curl http://localhost:8080/actuator/health

# Check browser console for CORS errors
# Check that backend services are all running
```

---

## 📊 Service Status Dashboard

Create a simple status check script `check-services.sh`:

```bash
#!/bin/bash

echo "🔍 Checking Mobility Platform Services..."
echo ""

# Infrastructure
echo "📦 Infrastructure:"
echo -n "  PostgreSQL:  "
docker exec mobility-postgres pg_isready -U mobility_user > /dev/null 2>&1 && echo "✅" || echo "❌"
echo -n "  RabbitMQ:    "
curl -s http://localhost:15672 > /dev/null && echo "✅" || echo "❌"
echo -n "  Redis:       "
docker exec mobility-redis redis-cli ping > /dev/null 2>&1 && echo "✅" || echo "❌"

echo ""
echo "🚀 Backend Services:"
echo -n "  API Gateway (8080):  "
curl -s http://localhost:8080/actuator/health > /dev/null 2>&1 && echo "✅" || echo "❌"
echo -n "  User Service (8081): "
curl -s http://localhost:8081/api/users/health > /dev/null 2>&1 && echo "✅" || echo "❌"
echo -n "  Vehicle Service (8082): "
curl -s http://localhost:8082/api/vehicles/health > /dev/null 2>&1 && echo "✅" || echo "❌"
echo -n "  Booking Service (8083): "
curl -s http://localhost:8083/api/bookings/health > /dev/null 2>&1 && echo "✅" || echo "❌"
echo -n "  Pricing Service (8084): "
curl -s http://localhost:8084/api/pricing/health > /dev/null 2>&1 && echo "✅" || echo "❌"
echo -n "  Driver Service (8085):  "
curl -s http://localhost:8085/api/drivers/health > /dev/null 2>&1 && echo "✅" || echo "❌"
echo -n "  Review Service (8086):  "
curl -s http://localhost:8086/api/reviews/health > /dev/null 2>&1 && echo "✅" || echo "❌"

echo ""
echo "🎨 Frontend:"
echo -n "  React App (3000):    "
curl -s http://localhost:3000 > /dev/null 2>&1 && echo "✅" || echo "❌"

echo ""
echo "✨ Platform Status Check Complete!"
```

Run it:

```bash
chmod +x check-services.sh
./check-services.sh
```

---

## 💡 Pro Tips

### Faster Development Startup

1. **Keep infrastructure running**: Don't stop PostgreSQL/RabbitMQ/Redis
2. **Use IDE**: Import backend as Maven project in IntelliJ/Eclipse
3. **Hot reload**: Use Spring Boot DevTools
4. **Skip tests**: `mvn install -DskipTests` for faster builds

### Database Management

```bash
# Connect to PostgreSQL
docker exec -it mobility-postgres psql -U mobility_user -d user_service

# View all databases
\l

# Connect to specific database
\c vehicle_service

# View tables
\dt

# View PostGIS version
SELECT PostGIS_Full_Version();
```

### RabbitMQ Management

```bash
# View queues via CLI
docker exec mobility-rabbitmq rabbitmqctl list_queues -p mobility_vhost

# View exchanges
docker exec mobility-rabbitmq rabbitmqctl list_exchanges -p mobility_vhost

# Or use Web UI: http://localhost:15672
```

---

## 🎉 You're Ready!

If all services show ✅ in the status check, you have a **fully functional Mobility Rental Platform**!

### What You Can Do Now:

1. ✅ **Register users** and authenticate with JWT
2. ✅ **Create vehicles** with GPS locations
3. ✅ **Search vehicles** by location (PostGIS)
4. ✅ **Calculate prices** with dynamic pricing
5. ✅ **Create bookings** with/without driver
6. ✅ **Process payments** (create + verify transactions)
7. ✅ **Manage bookings** (confirm, start, complete, cancel)
8. ✅ **Leave reviews** and ratings
9. ✅ **Track everything** via dashboards

---

## 📞 Need Help?

- **Documentation**: Check `/README.md`, `/backend/README.md`, `/frontend/README.md`
- **Deployment**: See `/DEPLOYMENT_GUIDE.md`
- **API Docs**: Swagger UI at http://localhost:808X/api/{service}/swagger-ui.html
- **Infrastructure**: See `/infrastructure/docker/README.md`

---

**Happy Coding! 🚀**






