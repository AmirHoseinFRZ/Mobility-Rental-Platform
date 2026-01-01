# Docker Compose Guide

This guide explains how to use Docker Compose to manage all services in the Mobility Rental Platform.

## Overview

The `docker-compose.yml` file includes:
- **Infrastructure services**: PostgreSQL, RabbitMQ, Redis (always available)
- **Backend services**: Eureka Server, API Gateway, and 8 microservices (profile: `backend`)
- **Frontend service**: React application with Nginx (profile: `frontend`)
- **Admin tools**: pgAdmin, Redis Commander (profile: `admin-tools`)

## Quick Start

### Start Everything (Infrastructure + Backend + Frontend)

```bash
# Start all services
docker-compose --profile backend --profile frontend up -d

# Or use the shorthand
docker-compose --profile backend --profile frontend up -d
```

### Start Services Separately

#### 1. Start Only Infrastructure (PostgreSQL, RabbitMQ, Redis)

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- RabbitMQ (ports 5672, 15672)
- Redis (port 6379)

#### 2. Start Backend Services

```bash
docker-compose --profile backend up -d
```

This starts:
- Eureka Server (port 8761)
- API Gateway (port 8080)
- User Service (port 8081)
- Vehicle Service (port 8082)
- Booking Service (port 8083)
- Pricing Service (port 8084)
- Driver Service (port 8085)
- Review Service (port 8086)
- Location Service (port 8087)
- Maintenance Service (port 8088)

#### 3. Start Frontend

```bash
docker-compose --profile frontend up -d
```

This starts:
- Frontend (port 3000 by default, configurable via `FRONTEND_PORT`)

#### 4. Start Admin Tools (Optional)

```bash
docker-compose --profile admin-tools up -d
```

This starts:
- pgAdmin (port 5050)
- Redis Commander (port 8081)

## Common Commands

### View Running Services

```bash
docker-compose ps
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway
docker-compose logs -f frontend
docker-compose logs -f user-service
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop specific profile
docker-compose --profile backend down
docker-compose --profile frontend down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart api-gateway
docker-compose restart frontend
```

### Rebuild Services

```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build api-gateway
docker-compose build frontend
docker-compose build user-service

# Rebuild and restart specific service (after code changes)
docker-compose build user-service && docker-compose --profile backend up -d user-service

# Force rebuild without cache (if changes aren't picked up)
docker-compose build --no-cache user-service && docker-compose --profile backend up -d user-service

# Rebuild and restart all services
docker-compose up -d --build
```

### Update Service After Code Changes

When you modify code in a service, rebuild and restart it:

```bash
# Method 1: One command (recommended)
docker-compose build user-service && docker-compose --profile backend up -d user-service

# Method 2: Step by step
docker-compose stop user-service
docker-compose build user-service
docker-compose --profile backend up -d user-service

# Method 3: Force rebuild (if changes aren't detected)
docker-compose build --no-cache user-service && docker-compose --profile backend up -d user-service

# Verify the new container is running
docker-compose ps user-service
docker-compose logs -f user-service
```

### Scale Services (if needed)

```bash
# Scale a specific service (example: 3 instances of user-service)
docker-compose --profile backend up -d --scale user-service=3
```

## Service Dependencies

Services start in the correct order automatically:
1. **Infrastructure** (postgres, rabbitmq, redis) - no dependencies
2. **Eureka Server** - depends on infrastructure
3. **Backend Services** - depend on Eureka Server and infrastructure
4. **API Gateway** - depends on Eureka Server and infrastructure
5. **Frontend** - depends on API Gateway

## Environment Variables

Create a `.env` file in the project root (copy from `env.example`):

```bash
cp env.example .env
```

Key variables:
- `POSTGRES_USER`, `POSTGRES_PASSWORD` - Database credentials
- `RABBITMQ_USER`, `RABBITMQ_PASSWORD` - RabbitMQ credentials
- `REDIS_PASSWORD` - Redis password
- `FRONTEND_PORT` - Frontend port (default: 3000)
- `JWT_SECRET` - JWT secret key for authentication

## Access Points

Once services are running:

- **Frontend**: http://localhost:3000 (or `FRONTEND_PORT`)
- **API Gateway**: http://localhost:8080
- **Eureka Dashboard**: http://localhost:8761
- **RabbitMQ Management**: http://localhost:15672
- **pgAdmin**: http://localhost:5050 (if admin-tools profile is active)
- **Redis Commander**: http://localhost:8081 (if admin-tools profile is active)

## Health Checks

All services include health checks. Check service health:

```bash
# Check all services
docker-compose ps

# Check specific service health
docker inspect mobility-api-gateway | grep -A 10 Health
```

## Troubleshooting

### Services Won't Start

1. Check if ports are already in use:
```bash
# Check port usage
netstat -tulpn | grep :8080
netstat -tulpn | grep :5432
```

2. Check logs:
```bash
docker-compose logs service-name
```

3. Rebuild services:
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Issues

1. Ensure PostgreSQL is healthy:
```bash
docker-compose ps postgres
docker-compose logs postgres
```

2. Check database is ready:
```bash
docker exec mobility-postgres pg_isready -U mobility_user
```

### Service Discovery Issues

1. Check Eureka Server is running:
```bash
docker-compose ps eureka-server
curl http://localhost:8761
```

2. Verify services are registered:
- Visit http://localhost:8761
- Check "Instances currently registered with Eureka"

## Best Practices

1. **Start infrastructure first**: Always start infrastructure services before backend services
2. **Use profiles**: Use profiles to start only what you need
3. **Monitor logs**: Use `docker-compose logs -f` to monitor service startup
4. **Health checks**: Wait for health checks to pass before accessing services
5. **Environment variables**: Use `.env` file for configuration, never commit secrets

## Example Workflows

### Development Workflow

```bash
# Start infrastructure
docker-compose up -d

# Start backend services
docker-compose --profile backend up -d

# View logs
docker-compose --profile backend logs -f

# After making code changes to user-service:
# Rebuild and restart the service
docker-compose build user-service && docker-compose --profile backend up -d user-service

# Or force rebuild if changes aren't detected
docker-compose build --no-cache user-service && docker-compose --profile backend up -d user-service

# View logs to verify
docker-compose logs -f user-service
```

### Production-like Workflow

```bash
# Start everything
docker-compose --profile backend --profile frontend up -d

# Monitor all services
docker-compose ps
docker-compose logs -f

# Scale services if needed
docker-compose --profile backend up -d --scale user-service=2
```

### Testing Workflow

```bash
# Start only infrastructure and specific backend service
docker-compose up -d
docker-compose --profile backend up -d user-service

# Run tests
# ...

# Stop services
docker-compose down
```

