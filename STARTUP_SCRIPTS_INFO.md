# 🚀 Startup Scripts Documentation

## Overview

This project includes automated startup scripts that launch the entire Mobility Rental Platform with a single command. No more manually starting services one by one!

## Available Scripts

### Start Scripts

| Script | Platform | Description |
|--------|----------|-------------|
| `start-all.ps1` | Windows PowerShell | Starts everything on Windows |
| `start-all.sh` | Linux/Mac Bash | Starts everything on Unix systems |

### Stop Scripts

| Script | Platform | Description |
|--------|----------|-------------|
| `stop-all.ps1` | Windows PowerShell | Stops all services on Windows |
| `stop-all.sh` | Linux/Mac Bash | Stops all services on Unix systems |

## Features

### ✅ Intelligent Pre-flight Checks
- Verifies Docker is installed and running
- Checks Java JDK 17+ availability
- Validates Maven installation
- Confirms Node.js 18+ and npm
- Reports missing dependencies with download links

### ✅ Automated Environment Setup
- Creates `.env` files from examples if missing
- Sets up frontend environment configuration
- No manual configuration needed

### ✅ Infrastructure Management
- Starts Docker Compose (PostgreSQL + RabbitMQ + Redis)
- Waits for services to be ready before proceeding
- Validates container health

### ✅ Backend Build & Deployment
- Runs Maven build for all microservices
- Skips tests for faster startup
- Reports build errors clearly

### ✅ Service Orchestration
- Starts 9 microservices in sequence
- Each service gets its own process/window
- Proper startup delays to avoid conflicts

### ✅ Frontend Setup
- Installs npm dependencies (first run only)
- Starts React development server
- Auto-opens browser to application

### ✅ Color-Coded Output
- **Yellow**: Section headers
- **Cyan**: Action steps
- **Green**: Success messages
- **Red**: Error messages
- **White**: Information

### ✅ Comprehensive Summary
- Lists all service URLs
- Shows infrastructure access points
- Provides credentials
- Displays next steps

## Script Execution Flow

```
START
  │
  ├─► [1] Pre-flight Checks
  │     ├─ Check Docker
  │     ├─ Check Java
  │     ├─ Check Maven
  │     ├─ Check Node.js
  │     └─ Check npm
  │
  ├─► [2] Environment Setup
  │     ├─ Create .env (if missing)
  │     └─ Create frontend/.env (if missing)
  │
  ├─► [3] Start Infrastructure
  │     ├─ docker-compose up -d
  │     ├─ Wait 30 seconds
  │     └─ Verify containers running
  │
  ├─► [4] Build Backend
  │     ├─ cd backend
  │     ├─ mvn clean install -DskipTests
  │     └─ cd ..
  │
  ├─► [5] Start Backend Services
  │     ├─ API Gateway (8080)
  │     ├─ User Service (8081)
  │     ├─ Vehicle Service (8082)
  │     ├─ Booking Service (8083)
  │     ├─ Pricing Service (8084)
  │     ├─ Driver Service (8085)
  │     ├─ Review Service (8086)
  │     ├─ Location Service (8087)
  │     ├─ Maintenance Service (8088)
  │     └─ Wait 45 seconds
  │
  ├─► [6] Setup Frontend
  │     ├─ cd frontend
  │     ├─ npm install (if node_modules missing)
  │     └─ cd ..
  │
  ├─► [7] Start Frontend
  │     ├─ cd frontend
  │     ├─ npm start (in background)
  │     └─ cd ..
  │
  └─► [8] Display Summary
        ├─ Service URLs
        ├─ Access points
        ├─ Credentials
        └─ Next steps
  
COMPLETE
```

## Platform-Specific Behavior

### Windows (PowerShell)

**Process Management:**
- Each service opens in a separate PowerShell window
- Window title shows service name and port
- Services continue running when startup script closes
- Easy to see logs for each service

**Logging:**
- Real-time logs visible in each window
- Console output color-coded
- Errors immediately visible

**Stopping:**
- `stop-all.ps1` finds and kills all Java and Node processes
- Closes PowerShell windows
- Stops Docker containers

### Linux/Mac (Bash)

**Process Management:**
- Services run in background
- PID saved to `logs/<service>.pid`
- All services managed by the main script

**Logging:**
- Logs saved to `logs/<service>.log`
- Use `tail -f logs/<service>.log` to view
- Persistent across sessions

**Stopping:**
- `stop-all.sh` reads PIDs from files
- Gracefully kills each process
- Cleans up PID files
- Stops Docker containers

## Timing

### First Run (Clean Installation)

| Phase | Duration | Notes |
|-------|----------|-------|
| Pre-flight checks | 5 seconds | Verifies installations |
| Infrastructure | 30 seconds | Docker containers |
| Maven build | 2-5 minutes | Downloads dependencies |
| Backend startup | 45 seconds | Service initialization |
| Frontend install | 1-3 minutes | npm install |
| Frontend startup | 30 seconds | React dev server |
| **TOTAL** | **5-8 minutes** | First time only |

### Subsequent Runs (Dependencies Cached)

| Phase | Duration | Notes |
|-------|----------|-------|
| Pre-flight checks | 5 seconds | Quick validation |
| Infrastructure | 10 seconds | Containers already exist |
| Maven build | 30 seconds | Dependencies cached |
| Backend startup | 45 seconds | Service initialization |
| Frontend install | 0 seconds | Already installed |
| Frontend startup | 30 seconds | React dev server |
| **TOTAL** | **2-3 minutes** | Much faster! |

## Ports Used

| Port | Service | Protocol |
|------|---------|----------|
| 3000 | React Frontend | HTTP |
| 5432 | PostgreSQL | TCP |
| 6379 | Redis | TCP |
| 5672 | RabbitMQ | AMQP |
| 15672 | RabbitMQ Management | HTTP |
| 8080 | API Gateway | HTTP |
| 8081 | User Service | HTTP |
| 8082 | Vehicle Service | HTTP |
| 8083 | Booking Service | HTTP |
| 8084 | Pricing Service | HTTP |
| 8085 | Driver Service | HTTP |
| 8086 | Review Service | HTTP |
| 8087 | Location Service | HTTP |
| 8088 | Maintenance Service | HTTP |

## System Requirements

### Minimum
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Disk**: 10 GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)

### Recommended
- **CPU**: 8 cores
- **RAM**: 16 GB
- **Disk**: 20 GB free space (SSD preferred)
- **OS**: Windows 11, macOS 12+, or Linux (Ubuntu 22.04+)

## Troubleshooting

### Script Won't Run (Windows)

**Error**: "Execution policy prevents script from running"

**Solution**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Script Won't Run (Linux/Mac)

**Error**: "Permission denied"

**Solution**:
```bash
chmod +x start-all.sh stop-all.sh
```

### Port Conflict

**Error**: "Port 8080 already in use"

**Solution**:

Windows:
```powershell
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

Linux/Mac:
```bash
lsof -ti:8080 | xargs kill -9
```

### Docker Not Running

**Error**: "Cannot connect to Docker daemon"

**Solution**:
- Start Docker Desktop
- Wait for it to fully initialize
- Run the script again

### Maven Build Fails

**Error**: "Build failure" or dependency errors

**Solution**:
```bash
cd backend
mvn clean install -U
cd ..
```

The `-U` flag forces dependency updates.

### npm Install Fails

**Error**: "npm ERR!"

**Solution**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
cd ..
```

### Services Won't Start

**Solution**: Full cleanup and restart

```bash
# Stop everything
./stop-all.sh  # or stop-all.ps1

# Remove Docker volumes
docker-compose down -v

# Start again
./start-all.sh  # or start-all.ps1
```

## Advanced Usage

### Custom Configuration

Edit `.env` files before running:

```bash
# Root .env - Backend configuration
DATABASE_PASSWORD=your_password
RABBITMQ_PASSWORD=your_password

# frontend/.env - Frontend configuration
REACT_APP_API_URL=http://localhost:8080
```

### Skip Infrastructure

If you already have infrastructure running:

1. Comment out the infrastructure section in the script
2. Or manually start services after infrastructure

### Development Mode

Services support hot reload:
- **Frontend**: React hot reload enabled
- **Backend**: Restart individual service window/process

### Production Build

For production deployment:

```bash
# Build backend
cd backend
mvn clean package -Pprod

# Build frontend
cd frontend
npm run build
```

Then use Docker Compose or Kubernetes for deployment.

## Files Created by Scripts

### Windows
```
Mobility-Rental-Platform/
├── .env                    (if created from template)
├── frontend/.env           (if created from template)
└── [Multiple PowerShell windows with services]
```

### Linux/Mac
```
Mobility-Rental-Platform/
├── .env                    (if created from template)
├── frontend/.env           (if created from template)
└── logs/
    ├── api-gateway.log
    ├── api-gateway.pid
    ├── user-service.log
    ├── user-service.pid
    ├── ... (other services)
    ├── frontend.log
    └── frontend.pid
```

## Clean Up

### Stop Services
```bash
.\stop-all.ps1      # Windows
./stop-all.sh       # Linux/Mac
```

### Remove All Data
```bash
docker-compose down -v      # Remove volumes
rm -rf logs/                # Remove logs (Linux/Mac)
```

### Complete Reset
```bash
# Stop everything
.\stop-all.ps1

# Remove all Docker data
docker-compose down -v

# Remove Maven cache (optional)
rm -rf ~/.m2/repository

# Remove npm cache (optional)
cd frontend
rm -rf node_modules
npm cache clean --force
```

## Benefits

✅ **Time Saving**: Start everything in one command vs 10+ manual steps  
✅ **Consistency**: Same startup process every time  
✅ **Error Prevention**: Pre-flight checks catch issues early  
✅ **Documentation**: Scripts document the startup process  
✅ **Onboarding**: New developers can start quickly  
✅ **Testing**: Easy to spin up complete environment  
✅ **Demo**: Quick setup for presentations  

## Support

For issues with the scripts:
1. Check this documentation
2. Review the script output for errors
3. Verify prerequisites are installed
4. Try the troubleshooting steps
5. Check individual service logs

---

**Made with ❤️ for easier development**





