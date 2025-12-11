# Docker Infrastructure Setup

This directory contains Docker configurations for the Mobility Rental Platform infrastructure services.

## Services

### 1. PostgreSQL with PostGIS
- **Image**: `postgis/postgis:16-3.4`
- **Port**: 5432 (configurable)
- **Features**:
  - PostgreSQL 16 with PostGIS 3.4 extension
  - Automatic creation of separate databases for each microservice
  - PostGIS extensions enabled for all databases
  - Persistent storage with Docker volumes

### 2. RabbitMQ
- **Image**: `rabbitmq:3.13-management-alpine`
- **Ports**: 
  - 5672 (AMQP)
  - 15672 (Management UI)
- **Features**:
  - Pre-configured exchanges and queues
  - Topic-based routing for event-driven architecture
  - Dead letter queue for failed messages
  - Management UI for monitoring

### 3. Redis
- **Image**: `redis:7.2-alpine`
- **Port**: 6379 (configurable)
- **Features**:
  - LRU cache eviction policy
  - AOF persistence enabled
  - 512MB memory limit
  - Optimized for caching

### 4. pgAdmin (Optional)
- **Port**: 5050 (configurable)
- **Purpose**: PostgreSQL database management UI
- **Profile**: `admin-tools`

### 5. Redis Commander (Optional)
- **Port**: 8081 (configurable)
- **Purpose**: Redis management UI
- **Profile**: `admin-tools`

## Quick Start

### 1. Environment Setup

Copy the environment example file and configure it:

```bash
# Copy the example file
cp env.example .env

# Edit .env with your preferred values
```

### 2. Start Core Services

```bash
# Start PostgreSQL, RabbitMQ, and Redis
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 3. Start with Admin Tools (Optional)

```bash
# Start all services including pgAdmin and Redis Commander
docker-compose --profile admin-tools up -d
```

### 4. Stop Services

```bash
# Stop all running services
docker-compose down

# Stop and remove volumes (WARNING: This deletes all data)
docker-compose down -v
```

## Service Access

### PostgreSQL
- **Host**: localhost
- **Port**: 5432
- **Username**: `mobility_user` (default)
- **Password**: `mobility_password` (default)
- **Main Database**: `mobility_platform`

**Microservice Databases**:
- `user_service`
- `vehicle_service`
- `booking_service`
- `pricing_service`
- `payment_service`
- `location_service`
- `review_service`
- `driver_service`
- `maintenance_service`

**Connection String Example**:
```
jdbc:postgresql://localhost:5432/user_service?user=mobility_user&password=mobility_password
```

### RabbitMQ
- **AMQP Port**: 5672
- **Management UI**: http://localhost:15672
- **Username**: `mobility_user` (default)
- **Password**: `mobility_password` (default)
- **Virtual Host**: `mobility_vhost`

**Pre-configured Queues**:
- `booking.created`, `booking.confirmed`, `booking.cancelled`, `booking.completed`
- `payment.processing`, `payment.completed`, `payment.failed`
- `vehicle.status.updated`, `vehicle.location.updated`
- `driver.assigned`, `driver.location.updated`
- `user.registered`
- `review.created`
- `maintenance.scheduled`
- `dead.letter.queue`

**Connection String Example**:
```
amqp://mobility_user:mobility_password@localhost:5672/mobility_vhost
```

### Redis
- **Host**: localhost
- **Port**: 6379
- **Password**: `mobility_redis_password` (default)

**Connection String Example**:
```
redis://:mobility_redis_password@localhost:6379
```

### pgAdmin (Optional)
- **URL**: http://localhost:5050
- **Email**: `admin@mobility.com` (default)
- **Password**: `admin_password` (default)

### Redis Commander (Optional)
- **URL**: http://localhost:8081

## Database Initialization

The PostgreSQL container automatically:
1. Creates the main database (`mobility_platform`)
2. Creates separate databases for each microservice
3. Enables PostGIS extensions on all databases
4. Sets up proper permissions

The initialization script is located at: `postgres/init/01-init-databases.sh`

## RabbitMQ Configuration

### Exchanges
- **mobility.events** (topic): Main event exchange for all domain events
- **mobility.direct** (direct): Direct routing for specific messages
- **dead.letter.exchange** (direct): Handles failed messages

### Routing Patterns
- `booking.*`: All booking-related events
- `payment.*`: All payment-related events
- `vehicle.status.*`: Vehicle status updates
- `vehicle.location.*`: Vehicle location updates
- `driver.location.*`: Driver location updates

### Message TTL
- Most queues: 24 hours (86400000 ms)
- Location updates: 1 hour (3600000 ms)

## Redis Configuration

### Key Features
- **Eviction Policy**: `allkeys-lru` (Least Recently Used)
- **Max Memory**: 512MB
- **Persistence**: AOF (Append Only File) for durability
- **Use Cases**:
  - Session storage
  - Cache frequently accessed data
  - Rate limiting
  - Real-time leaderboards
  - Temporary data storage

### Recommended Key Patterns
```
user:session:{userId}
vehicle:availability:{vehicleId}
booking:cache:{bookingId}
pricing:cache:{vehicleType}:{location}
driver:location:{driverId}
```

## Health Checks

All services have health checks configured:

### PostgreSQL
```bash
docker exec mobility-postgres pg_isready -U mobility_user -d mobility_platform
```

### RabbitMQ
```bash
docker exec mobility-rabbitmq rabbitmq-diagnostics ping
```

### Redis
```bash
docker exec mobility-redis redis-cli --raw incr ping
```

## Monitoring

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f rabbitmq
docker-compose logs -f redis
```

### Check Resource Usage
```bash
docker stats
```

## Backup and Restore

### PostgreSQL Backup
```bash
# Backup all databases
docker exec mobility-postgres pg_dumpall -U mobility_user > backup.sql

# Backup specific database
docker exec mobility-postgres pg_dump -U mobility_user user_service > user_service_backup.sql
```

### PostgreSQL Restore
```bash
# Restore all databases
docker exec -i mobility-postgres psql -U mobility_user < backup.sql

# Restore specific database
docker exec -i mobility-postgres psql -U mobility_user user_service < user_service_backup.sql
```

### Redis Backup
```bash
# Trigger save
docker exec mobility-redis redis-cli --raw BGSAVE

# Copy RDB file
docker cp mobility-redis:/data/dump.rdb ./redis_backup.rdb
```

## Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check if service is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Test connection
docker exec -it mobility-postgres psql -U mobility_user -d mobility_platform
```

### RabbitMQ Issues
```bash
# Check status
docker exec mobility-rabbitmq rabbitmqctl status

# List queues
docker exec mobility-rabbitmq rabbitmqctl list_queues -p mobility_vhost

# View connections
docker exec mobility-rabbitmq rabbitmqctl list_connections
```

### Redis Issues
```bash
# Check if running
docker exec mobility-redis redis-cli --raw ping

# Get info
docker exec mobility-redis redis-cli --raw INFO

# Check memory usage
docker exec mobility-redis redis-cli --raw INFO memory
```

### Reset Everything
```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Remove all images (optional)
docker-compose down --rmi all

# Start fresh
docker-compose up -d
```

## Network Configuration

All services are connected via the `mobility-network` bridge network. This allows:
- Service-to-service communication using container names
- Isolation from other Docker networks
- Easy service discovery

## Volume Management

### List Volumes
```bash
docker volume ls | grep mobility
```

### Inspect Volume
```bash
docker volume inspect mobility-postgres-data
```

### Remove Volumes (WARNING: Deletes all data)
```bash
docker volume rm mobility-postgres-data
docker volume rm mobility-rabbitmq-data
docker volume rm mobility-redis-data
```

## Production Considerations

For production deployment, consider:

1. **Security**:
   - Change all default passwords
   - Use secrets management (Docker Swarm secrets, Kubernetes secrets)
   - Enable SSL/TLS for all connections
   - Restrict network access with firewalls

2. **High Availability**:
   - Use PostgreSQL replication (master-slave or multi-master)
   - Set up RabbitMQ clustering
   - Configure Redis Sentinel or Redis Cluster
   - Use load balancers

3. **Backup**:
   - Implement automated backup schedules
   - Store backups in remote locations
   - Test restore procedures regularly

4. **Monitoring**:
   - Set up Prometheus metrics exporters
   - Configure Grafana dashboards
   - Implement alerting rules
   - Use centralized logging (ELK stack)

5. **Scaling**:
   - Use Kubernetes or Docker Swarm for orchestration
   - Configure horizontal pod autoscaling
   - Implement connection pooling
   - Use read replicas for databases

## Support

For issues or questions, refer to:
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Redis Documentation](https://redis.io/documentation)

