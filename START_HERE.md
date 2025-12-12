# 🎯 START HERE - Quick Setup Guide

## 🚀 One-Command Startup (Recommended)

### For Windows Users

Open PowerShell in this directory and run:

```powershell
.\start-all.ps1
```

### For Linux/Mac Users

Open Terminal in this directory and run:

```bash
chmod +x start-all.sh stop-all.sh
./start-all.sh
```

---

## ⏱️ What to Expect

### First Time
- **Build Time**: 3-5 minutes (Maven downloads dependencies)
- **Startup Time**: 2-3 minutes (services initialize)
- **Total**: ~5-8 minutes

### Subsequent Runs
- **Build Time**: 30 seconds (dependencies cached)
- **Startup Time**: 1-2 minutes
- **Total**: ~2-3 minutes

---

## ✅ Prerequisites Check

Before running, make sure you have installed:

- [x] **Docker Desktop** - https://www.docker.com/products/docker-desktop
- [x] **Java JDK 17+** - https://adoptium.net/
- [x] **Maven 3.9+** - https://maven.apache.org/download.cgi
- [x] **Node.js 18+** - https://nodejs.org/

> 💡 The script will check for these automatically and tell you if anything is missing!

---

## 📊 After Startup - Access Your Application

Once the script completes (look for "STARTUP COMPLETE!"), open:

### 🌐 Main Application
**http://localhost:3000**

This is your React frontend where users can:
- Register and login
- Search for vehicles by location
- Book vehicles with/without driver
- Make payments
- View bookings
- Leave reviews

### 🔌 API Gateway
**http://localhost:8080**

This is the main backend entry point that routes to all microservices.

### 🐰 RabbitMQ Management
**http://localhost:15672**
- Username: `mobility_user`
- Password: `mobility_password`

---

## 🛑 Stop All Services

When you're done, stop everything with:

### Windows
```powershell
.\stop-all.ps1
```

### Linux/Mac
```bash
./stop-all.sh
```

---

## 📝 What the Script Does

```
┌─────────────────────────────────────┐
│  1. Pre-flight Checks               │  ← Verifies Docker, Java, Maven, Node
│  2. Environment Setup               │  ← Creates .env files
│  3. Start Infrastructure            │  ← PostgreSQL, RabbitMQ, Redis
│  4. Build Backend                   │  ← Maven build all services
│  5. Start Backend Services (9)     │  ← All microservices
│  6. Install Frontend Dependencies  │  ← npm install (if needed)
│  7. Start Frontend                 │  ← React dev server
│  8. Success Summary                │  ← URLs and access info
└─────────────────────────────────────┘
```

---

## 🎨 Service Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│                   http://localhost:3000                      │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                   API Gateway :8080                          │
└──────┬───────────────────────────────────────────────────────┘
       │
       ├─► User Service          :8081
       ├─► Vehicle Service       :8082  (PostGIS)
       ├─► Booking Service       :8083
       ├─► Pricing Service       :8084
       ├─► Driver Service        :8085  (PostGIS)
       ├─► Review Service        :8086
       ├─► Location Service      :8087  (PostGIS)
       └─► Maintenance Service   :8088
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  Infrastructure (Docker)                                     │
│  • PostgreSQL + PostGIS  :5432                              │
│  • RabbitMQ             :5672, :15672                       │
│  • Redis                :6379                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### "Script execution is disabled" (Windows)

Run this in PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "Permission denied" (Linux/Mac)

Make scripts executable:
```bash
chmod +x start-all.sh stop-all.sh
```

### Port Already in Use

Stop the conflicting service:

**Windows:**
```powershell
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -ti:8080 | xargs kill -9
```

### Docker Not Running

Start Docker Desktop before running the script.

### Services Won't Start

1. Stop everything: `.\stop-all.ps1` or `./stop-all.sh`
2. Remove Docker volumes: `docker-compose down -v`
3. Start again: `.\start-all.ps1` or `./start-all.sh`

---

## 📁 Directory Structure

```
Mobility-Rental-Platform/
│
├── 🚀 start-all.ps1           ← WINDOWS: Start everything
├── 🚀 start-all.sh            ← LINUX/MAC: Start everything
├── 🛑 stop-all.ps1            ← WINDOWS: Stop everything
├── 🛑 stop-all.sh             ← LINUX/MAC: Stop everything
│
├── 📚 START_HERE.md           ← This file
├── 📚 QUICK_START_GUIDE.md    ← Detailed guide
├── 📚 README.md               ← Project documentation
│
├── 🐳 docker-compose.yml      ← Infrastructure config
├── ⚙️ env.example             ← Environment template
│
├── 📂 backend/                ← 9 Spring Boot microservices
├── 📂 frontend/               ← React application
├── 📂 infrastructure/         ← Docker configurations
└── 📂 logs/                   ← Service logs (created on Linux/Mac)
```

---

## 🎯 Quick Test Flow

After startup, test the complete flow:

1. **Register** → http://localhost:3000/register
2. **Login** → http://localhost:3000/login
3. **Search Vehicles** → http://localhost:3000/search
4. **View Details** → Click on any vehicle
5. **Create Booking** → Select dates, with/without driver
6. **Payment** → Process payment
7. **My Bookings** → View your bookings
8. **Leave Review** → Rate the vehicle/driver

---

## 🎓 Learning Resources

- **Backend Code**: `backend/` directory - Spring Boot microservices
- **Frontend Code**: `frontend/src/` directory - React components
- **API Documentation**: http://localhost:808X/api/*/swagger-ui.html
- **Database**: Connect to PostgreSQL at `localhost:5432`

---

## 💡 Tips

✅ **First Run**: Grab a coffee - Maven downloads lots of dependencies  
✅ **Windows**: Each service opens in its own window  
✅ **Linux/Mac**: Check logs in `logs/` directory  
✅ **Hot Reload**: Frontend auto-reloads on code changes  
✅ **Debug**: Check individual service windows/logs for errors  

---

## 🆘 Need Help?

1. Check `QUICK_START_GUIDE.md` for detailed documentation
2. Look at service logs for error messages
3. Verify all prerequisites are correctly installed
4. Try stopping and starting again

---

## 🎉 You're Ready!

Run the command and watch your entire platform come to life!

```powershell
# Windows
.\start-all.ps1

# Linux/Mac
./start-all.sh
```

**Happy Coding! 🚗🏍️🚲**

