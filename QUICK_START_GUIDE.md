# 🚀 Quick Start Guide - Mobility Rental Platform

## One-Command Startup

Start **EVERYTHING** (Infrastructure + Backend + Frontend) with a single command!

### Windows (PowerShell)

```powershell
.\start-all.ps1
```

### Linux / Mac

```bash
chmod +x start-all.sh
./start-all.sh
```

---

## What Gets Started

The script automatically starts:

### 1. ✅ Infrastructure (Docker Containers)
- **PostgreSQL** with PostGIS on port `5432`
- **RabbitMQ** with Management UI on port `15672`
- **Redis** on port `6379`

### 2. ✅ Backend Microservices (9 Services)
- **API Gateway** - Port `8080` (Main entry point)
- **User Service** - Port `8081`
- **Vehicle Service** - Port `8082` (with PostGIS)
- **Booking Service** - Port `8083`
- **Pricing Service** - Port `8084`
- **Driver Service** - Port `8085` (with PostGIS)
- **Review Service** - Port `8086`
- **Location Service** - Port `8087` (with PostGIS)
- **Maintenance Service** - Port `8088`

### 3. ✅ Frontend
- **React Application** - Port `3000`

---

## Prerequisites

Before running the script, ensure you have:

| Tool | Version | Download |
|------|---------|----------|
| Docker | Latest | https://www.docker.com/products/docker-desktop |
| Docker Compose | Latest | Included with Docker Desktop |
| Java JDK | 17+ | https://adoptium.net/ |
| Maven | 3.9+ | https://maven.apache.org/download.cgi |
| Node.js | 18+ | https://nodejs.org/ |
| npm | Latest | Included with Node.js |

---

## First Time Setup

### 1. Clone the Repository

```bash
git clone https://github.com/AmirHoseinFRZ/Mobility-Rental-Platform.git
cd Mobility-Rental-Platform
```

### 2. Run the Startup Script

**Windows:**
```powershell
.\start-all.ps1
```

**Linux/Mac:**
```bash
chmod +x start-all.sh
./start-all.sh
```

### 3. Wait for Services to Start

- ⏱️ Infrastructure: ~30 seconds
- ⏱️ Backend build: ~2-5 minutes (first time)
- ⏱️ Backend services: ~45 seconds
- ⏱️ Frontend: ~30 seconds

**Total first-time startup: ~5-7 minutes**

### 4. Access the Application

Once completed, open your browser:
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080

---

## What Happens During Startup

### ✅ Pre-flight Checks
- Verifies Docker, Java, Maven, Node.js, and npm are installed
- Checks version compatibility

### ✅ Environment Setup
- Creates `.env` files from examples if they don't exist

### ✅ Infrastructure Startup
- Starts Docker Compose
- Waits for PostgreSQL, RabbitMQ, and Redis to be ready

### ✅ Backend Build
- Runs `mvn clean install` to build all microservices
- Skips tests for faster startup

### ✅ Backend Service Startup
- Starts each microservice in a separate window/process
- Each service gets its own log file

### ✅ Frontend Setup
- Installs npm dependencies (if not already installed)
- Starts React development server

### ✅ Summary Display
- Shows all service URLs
- Displays connection information
- Provides next steps

---

## Access Points After Startup

### Frontend
- **Main App**: http://localhost:3000
- Opens automatically in your browser

### Backend
- **API Gateway**: http://localhost:8080
- **Swagger Docs**: http://localhost:808X/api/*/swagger-ui.html
  - Replace 808X with service port (8081-8088)

### Infrastructure
- **RabbitMQ Management**: http://localhost:15672
  - Username: `mobility_user`
  - Password: `mobility_password`
- **PostgreSQL**: `localhost:5432`
  - Username: `mobility_user`
  - Password: `mobility_password`
- **Redis**: `localhost:6379`

---

## Stopping All Services

### Windows (PowerShell)

```powershell
.\stop-all.ps1
```

### Linux / Mac

```bash
./stop-all.sh
```

This will:
- Stop all backend microservices
- Stop the frontend
- Stop and remove Docker containers
- Clean up all processes

---

## Troubleshooting

### Script won't run (Windows)

If you get "script execution is disabled" error:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port Already in Use

If a port is already in use:

**Windows:**
```powershell
# Find process using port 8080
netstat -ano | findstr :8080
# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Find and kill process on port 8080
lsof -ti:8080 | xargs kill -9
```

### Docker Not Running

Make sure Docker Desktop is running before executing the script.

### Maven Build Fails

```bash
cd backend
mvn clean install -U
```

The `-U` flag forces update of dependencies.

### Frontend Won't Start

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## Directory Structure After Startup

```
Mobility-Rental-Platform/
├── logs/                       # Service logs (Linux/Mac)
│   ├── api-gateway.log
│   ├── user-service.log
│   └── ... (other service logs)
├── backend/                    # Backend services
├── frontend/                   # React application
├── start-all.ps1              # Windows startup script
├── start-all.sh               # Linux/Mac startup script
├── stop-all.ps1               # Windows stop script
├── stop-all.sh                # Linux/Mac stop script
└── docker-compose.yml         # Infrastructure config
```

---

## Viewing Logs

### Windows
Each service opens in its own PowerShell window. Check those windows for logs.

### Linux/Mac
Logs are saved in the `logs/` directory:

```bash
# View logs in real-time
tail -f logs/api-gateway.log

# View all logs
cat logs/user-service.log
```

---

## Check Service Status

### Windows
```powershell
# Check Java processes (backend)
Get-Process java

# Check Node processes (frontend)
Get-Process node

# Check Docker containers
docker ps
```

### Linux/Mac
```bash
# Check all services
ps aux | grep "spring-boot"

# Check frontend
ps aux | grep "react-scripts"

# Check Docker containers
docker ps
```

---

## Next Steps

1. ✅ Open http://localhost:3000
2. ✅ Register a new user account
3. ✅ Search for vehicles by location
4. ✅ Create a booking
5. ✅ Test the payment flow
6. ✅ Leave a review

---

## Common Use Cases

### Development Mode
Just run `start-all.ps1` or `start-all.sh` - services will hot-reload on code changes.

### Testing
All services are available for API testing at their respective ports.

### Demo
Perfect for showcasing the complete platform to stakeholders.

---

## Script Features

✅ **Color-coded output** for easy reading  
✅ **Pre-flight checks** verify all requirements  
✅ **Automatic environment setup** creates necessary config files  
✅ **Intelligent waiting** ensures services are ready  
✅ **Error handling** stops on critical failures  
✅ **Detailed logging** tracks all operations  
✅ **Clean shutdown** with stop scripts  

---

## Support

If you encounter any issues:

1. Check the logs in service windows (Windows) or `logs/` directory (Linux/Mac)
2. Verify all prerequisites are installed
3. Make sure no other services are using ports 3000, 5432, 6379, 8080-8088, or 15672
4. Try stopping all services and starting again

---

## Performance Notes

- **First startup**: Takes longer due to Maven dependencies download and npm install
- **Subsequent startups**: Much faster (~2-3 minutes total)
- **Memory usage**: Requires ~4-8 GB RAM for all services
- **Disk space**: Requires ~2-3 GB for dependencies and Docker images

---

**Enjoy your Mobility Rental Platform! 🚗🏍️🚲**





