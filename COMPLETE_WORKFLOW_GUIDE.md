# Complete Workflow Guide - Start, Update, and Stop Services

This guide explains the complete workflow for managing the Mobility Rental Platform using Docker Compose.

---

## 🚀 Part 1: Starting Everything

### Step 1: Prepare Environment

```bash
# Navigate to project root
cd /home/amirhosein/IdeaProjects/Mobility-Rental-Platform

# Copy environment file (if not already done)
cp env.example .env

# Edit .env if needed (optional)
# nano .env
```

### Step 2: Start All Services

**Option A: Start Everything at Once (Recommended)**

```bash
# Start infrastructure + backend + frontend
docker-compose --profile backend --profile frontend up -d
```

This single command starts:
- ✅ Infrastructure: PostgreSQL, RabbitMQ, Redis
- ✅ Eureka Server (service discovery)
- ✅ All 9 backend microservices
- ✅ Frontend application

**Option B: Start Step by Step**

```bash
# Step 1: Start infrastructure only
docker-compose up -d

# Wait 30 seconds for infrastructure to be ready
sleep 30

# Step 2: Start backend services
docker-compose --profile backend up -d

# Step 3: Start frontend
docker-compose --profile frontend up -d
```

### Step 3: Verify Everything is Running

```bash
# Check all services status
docker-compose ps

# You should see all services with "Up" status
```

**Expected Output:**
```
NAME                        STATUS          PORTS
mobility-postgres           Up (healthy)    0.0.0.0:5432->5432/tcp
mobility-rabbitmq           Up (healthy)    0.0.0.0:5672->5672/tcp, 0.0.0.0:15672->15672/tcp
mobility-redis              Up (healthy)    0.0.0.0:6379->6379/tcp
mobility-eureka-server      Up (healthy)    0.0.0.0:8761->8761/tcp
mobility-api-gateway        Up (healthy)    0.0.0.0:8080->8080/tcp
mobility-user-service       Up (healthy)    0.0.0.0:8081->8081/tcp
mobility-vehicle-service    Up (healthy)    0.0.0.0:8082->8082/tcp
mobility-booking-service    Up (healthy)    0.0.0.0:8083->8083/tcp
mobility-pricing-service    Up (healthy)    0.0.0.0:8084->8084/tcp
mobility-driver-service     Up (healthy)    0.0.0.0:8085->8085/tcp
mobility-review-service     Up (healthy)    0.0.0.0:8086->8086/tcp
mobility-location-service   Up (healthy)    0.0.0.0:8087->8087/tcp
mobility-maintenance-service Up (healthy)   0.0.0.0:8088->8088/tcp
mobility-frontend           Up (healthy)    0.0.0.0:3000->80/tcp
```

### Step 4: Check Logs (Optional)

```bash
# View logs for all services
docker-compose logs -f

# Or view logs for specific service
docker-compose logs -f user-service
docker-compose logs -f api-gateway
docker-compose logs -f frontend
```

### Step 5: Access the Application

Once all services are running:

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Eureka Dashboard**: http://localhost:8761
- **RabbitMQ Management**: http://localhost:15672

---

## 🔄 Part 2: Applying Changes to Running Services

When you modify code in any service, follow these steps:

### Scenario 1: Change Backend Service Code (e.g., user-service)

**Step 1: Make your code changes**
```bash
# Edit files in backend/user-service/src/...
# For example:
nano backend/user-service/src/main/java/.../UserController.java
```

**Step 2: Rebuild and restart the service**

```bash
# Method 1: Quick rebuild (recommended)
docker-compose build user-service && docker-compose --profile backend up -d user-service

# Method 2: Force rebuild (if changes aren't detected)
docker-compose build --no-cache user-service && docker-compose --profile backend up -d user-service
```

**Step 3: Verify the service restarted**

```bash
# Check status
docker-compose ps user-service

# View logs to see if it started correctly
docker-compose logs -f user-service
```

**What happens:**
1. Docker rebuilds the image with your new code
2. Stops the old container
3. Starts a new container with the updated image
4. Service re-registers with Eureka automatically

### Scenario 2: Change Frontend Code

**Step 1: Make your code changes**
```bash
# Edit files in frontend/src/...
# For example:
nano frontend/src/pages/Home.js
```

**Step 2: Rebuild and restart frontend**

```bash
# Rebuild and restart
docker-compose build frontend && docker-compose --profile frontend up -d frontend

# Or force rebuild
docker-compose build --no-cache frontend && docker-compose --profile frontend up -d frontend
```

**Step 3: Verify**

```bash
# Check status
docker-compose ps frontend

# View logs
docker-compose logs -f frontend
```

### Scenario 3: Change Multiple Services

```bash
# Rebuild multiple services
docker-compose build user-service vehicle-service && \
docker-compose --profile backend up -d user-service vehicle-service
```

### Scenario 4: Change API Gateway Configuration

If you change `application.yml` in api-gateway:

```bash
# Rebuild and restart
docker-compose build api-gateway && docker-compose --profile backend up -d api-gateway
```

### Quick Reference: Apply Changes to Any Service

```bash
# Backend service
docker-compose build <service-name> && docker-compose --profile backend up -d <service-name>

# Frontend
docker-compose build frontend && docker-compose --profile frontend up -d frontend

# Examples:
docker-compose build user-service && docker-compose --profile backend up -d user-service
docker-compose build vehicle-service && docker-compose --profile backend up -d vehicle-service
docker-compose build booking-service && docker-compose --profile backend up -d booking-service
docker-compose build api-gateway && docker-compose --profile backend up -d api-gateway
```

---

## 🛑 Part 3: Stopping Everything

### Stop All Services

```bash
# Stop all services (keeps containers, just stops them)
docker-compose down

# This stops:
# - All infrastructure services
# - All backend services
# - Frontend service
```

### Stop Specific Services

```bash
# Stop only backend services
docker-compose --profile backend down

# Stop only frontend
docker-compose --profile frontend down

# Stop only infrastructure (WARNING: backend services depend on this)
docker-compose stop postgres rabbitmq redis

# Stop specific service
docker-compose stop user-service
docker-compose stop frontend
```

### Stop and Remove Everything (Clean Slate)

```bash
# Stop all services and remove containers
docker-compose down

# Stop all services, remove containers AND volumes (WARNING: deletes all data!)
docker-compose down -v

# Stop all services, remove containers, volumes, AND images
docker-compose down -v --rmi all
```

### Stop Individual Service

```bash
# Stop one service
docker-compose stop user-service

# Stop and remove container
docker-compose rm -f user-service
```

---

## 📋 Complete Workflow Examples

### Example 1: Daily Development Workflow

```bash
# Morning: Start everything
docker-compose --profile backend --profile frontend up -d

# During day: Make changes to user-service
# ... edit code ...

# Apply changes
docker-compose build user-service && docker-compose --profile backend up -d user-service

# Check logs
docker-compose logs -f user-service

# Evening: Stop everything
docker-compose down
```

### Example 2: Testing Specific Service

```bash
# Start only infrastructure
docker-compose up -d

# Start only the service you're testing
docker-compose --profile backend up -d user-service

# Make changes and rebuild
docker-compose build user-service && docker-compose --profile backend up -d user-service

# Test the service
curl http://localhost:8081/api/users/health

# Stop when done
docker-compose stop user-service
```

### Example 3: Full Reset (Fresh Start)

```bash
# Stop everything and remove containers
docker-compose down

# Remove volumes (deletes database data - be careful!)
docker-compose down -v

# Rebuild everything from scratch
docker-compose build

# Start everything
docker-compose --profile backend --profile frontend up -d
```

---

## 🔍 Useful Commands Reference

### Status and Monitoring

```bash
# Check all services status
docker-compose ps

# Check specific service
docker-compose ps user-service

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f user-service

# View last 100 lines of logs
docker-compose logs --tail=100 user-service
```

### Rebuilding

```bash
# Rebuild specific service
docker-compose build user-service

# Rebuild without cache
docker-compose build --no-cache user-service

# Rebuild all services
docker-compose build

# Rebuild and restart
docker-compose build user-service && docker-compose --profile backend up -d user-service
```

### Starting/Stopping

```bash
# Start all
docker-compose --profile backend --profile frontend up -d

# Start specific service
docker-compose --profile backend up -d user-service

# Stop all
docker-compose down

# Stop specific service
docker-compose stop user-service

# Restart specific service
docker-compose restart user-service
```

### Cleanup

```bash
# Remove stopped containers
docker-compose rm

# Remove containers and volumes
docker-compose down -v

# Remove everything including images
docker-compose down -v --rmi all
```

---

## ⚠️ Important Notes

1. **Service Dependencies**: Backend services depend on infrastructure (postgres, rabbitmq, redis) and Eureka Server. Docker Compose handles this automatically.

2. **Health Checks**: Services wait for dependencies to be healthy before starting. This can take 30-60 seconds.

3. **Port Conflicts**: If ports are already in use, services won't start. Check with:
   ```bash
   netstat -tulpn | grep :8080
   ```

4. **Data Persistence**: Database data is stored in Docker volumes. Use `docker-compose down -v` only if you want to delete all data.

5. **Code Changes**: Always rebuild the service after code changes. Docker won't automatically detect file changes.

6. **Logs**: Use `docker-compose logs -f` to monitor service startup and debug issues.

---

## 🎯 Quick Command Cheat Sheet

```bash
# START EVERYTHING
docker-compose --profile backend --profile frontend up -d

# APPLY CHANGES TO user-service
docker-compose build user-service && docker-compose --profile backend up -d user-service

# APPLY CHANGES TO frontend
docker-compose build frontend && docker-compose --profile frontend up -d frontend

# STOP EVERYTHING
docker-compose down

# VIEW LOGS
docker-compose logs -f user-service

# CHECK STATUS
docker-compose ps
```

---

## 🆘 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs user-service

# Check if port is in use
netstat -tulpn | grep :8081

# Rebuild without cache
docker-compose build --no-cache user-service
docker-compose --profile backend up -d user-service
```

### Changes Not Applied

```bash
# Force rebuild
docker-compose build --no-cache user-service && docker-compose --profile backend up -d user-service

# Verify new container is running
docker-compose ps user-service
```

### Can't Stop Services

```bash
# Force stop
docker-compose kill

# Force remove
docker-compose rm -f
```

---

That's it! You now have the complete workflow for managing your platform. 🚀

