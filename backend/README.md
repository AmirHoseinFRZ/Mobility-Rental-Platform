# Mobility Rental Platform - Backend Services

This is the backend implementation for the Mobility Rental Platform using Spring Boot microservices architecture.

## Project Structure

```
backend/
├── common-lib/              # Shared library (DTOs, exceptions, security, events)
├── api-gateway/             # API Gateway (Entry point for all services)
├── user-service/            # User management and authentication (Port: 8081)
├── vehicle-service/         # Vehicle inventory with PostGIS (Port: 8082)
├── booking-service/         # Booking and reservation management (Port: 8083)
├── pricing-service/         # Dynamic pricing and discounts (Port: 8084)
├── driver-service/          # Driver management and assignment (Port: 8085)
├── review-service/          # Reviews and ratings (Port: 8086)
├── location-service/        # PostGIS location operations (Port: 8087)
├── maintenance-service/     # Vehicle maintenance tracking (Port: 8088)
└── pom.xml                  # Root Maven POM
```

## Completed Services

### ✅ Common Library (`common-lib`)
**Purpose**: Shared utilities and common functionality across all services

**Features**:
- Base entities with auditing (BaseEntity)
- API response wrappers (ApiResponse, PageResponse, ErrorDetails)
- Global exception handling (GlobalExceptionHandler)
- Custom exceptions (ResourceNotFoundException, BusinessException, UnauthorizedException)
- JWT utilities (JwtUtil)
- Event publisher for RabbitMQ messaging
- Common enums (BookingStatus, VehicleStatus, UserRole, PaymentStatus)

---

### ✅ User Service (`user-service`)
**Port**: 8081  
**Database**: `user_service`  
**Purpose**: User registration, authentication, and profile management

**Features**:
- User registration and login with JWT
- User profile CRUD operations
- Email and phone verification support
- KYC document management
- Driver license tracking
- Role-based access (CUSTOMER, DRIVER, ADMIN, SUPER_ADMIN)
- Password encryption with BCrypt
- Event publishing for user registration

**Key Endpoints**:
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login (returns JWT token)
- `GET /api/users/{id}` - Get user by ID
- `GET /api/users/email/{email}` - Get user by email
- `GET /api/users` - Get all users (paginated)
- `PUT /api/users/{id}` - Update user profile
- `DELETE /api/users/{id}` - Deactivate user

**Technologies**:
- Spring Security + JWT
- PostgreSQL
- Redis (caching)
- RabbitMQ (event publishing)
- Swagger/OpenAPI documentation

---

### ✅ Vehicle Service (`vehicle-service`)
**Port**: 8082  
**Database**: `vehicle_service`  
**Purpose**: Vehicle inventory management with geospatial tracking

**Features**:
- Vehicle CRUD operations
- **PostGIS integration** for location tracking
- Search vehicles by location and radius
- Find nearest vehicles
- Vehicle status management (AVAILABLE, BOOKED, IN_USE, MAINTENANCE, etc.)
- Support for with-driver and without-driver options
- Vehicle ratings and reviews tracking
- Maintenance and insurance tracking
- Real-time location updates

**Key Endpoints**:
- `POST /api/vehicles` - Create new vehicle
- `GET /api/vehicles/{id}` - Get vehicle by ID
- `GET /api/vehicles/available` - Get all available vehicles
- `POST /api/vehicles/search/location` - Search vehicles by location (PostGIS)
- `GET /api/vehicles/nearest` - Get nearest vehicles to a location
- `PATCH /api/vehicles/{id}/status` - Update vehicle status
- `PATCH /api/vehicles/{id}/location` - Update vehicle location

**PostGIS Features**:
- Store vehicle locations as geometry points (SRID 4326)
- Distance calculations using ST_Distance
- Radius-based search using ST_DWithin
- Haversine formula for accurate distance calculation

**Technologies**:
- Spring Data JPA
- **PostGIS/Hibernate Spatial**
- PostgreSQL
- Redis (caching)
- RabbitMQ (event publishing)

---

### ✅ Booking Service (`booking-service`)
**Port**: 8083  
**Database**: `booking_service`  
**Purpose**: Booking and reservation management

**Features**:
- Create bookings (with/without driver)
- Booking lifecycle management (PENDING → CONFIRMED → ONGOING → COMPLETED/CANCELLED)
- Conflict detection (prevents double booking)
- Integration with Vehicle Service (via Feign Client)
- Price calculation
- Booking history
- Special requests and notes
- Automatic vehicle status updates

**Key Endpoints**:
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/{id}` - Get booking by ID
- `GET /api/bookings/user/{userId}` - Get user's bookings
- `GET /api/bookings/vehicle/{vehicleId}` - Get vehicle's bookings
- `PATCH /api/bookings/{id}/confirm` - Confirm booking
- `PATCH /api/bookings/{id}/start` - Start booking
- `PATCH /api/bookings/{id}/complete` - Complete booking
- `PATCH /api/bookings/{id}/cancel` - Cancel booking

**Technologies**:
- Spring Cloud OpenFeign (inter-service communication)
- PostgreSQL
- RabbitMQ (event publishing)

---

## Services In Progress

The following services require completion:

### 🔨 Pricing Service (`pricing-service`)
**Port**: 8084  
**Database**: `pricing_service`  
**Purpose**: Dynamic pricing, discounts, and promotional offers

### 🔨 Driver Service (`driver-service`)
**Port**: 8085  
**Database**: `driver_service`  
**Purpose**: Driver management, availability, and assignment

### 🔨 Review Service (`review-service`)
**Port**: 8086  
**Database**: `review_service`  
**Purpose**: Customer reviews and ratings

### 🔨 Location Service (`location-service`)
**Port**: 8087  
**Database**: `location_service`  
**Purpose**: Centralized PostGIS operations and geofencing

### 🔨 Maintenance Service (`maintenance-service`)
**Port**: 8088  
**Database**: `maintenance_service`  
**Purpose**: Vehicle maintenance scheduling and tracking

### 🔨 API Gateway (`api-gateway`)
**Port**: 8080  
**Purpose**: Entry point, routing, authentication, rate limiting

---

## Technology Stack

### Frameworks & Libraries
- **Spring Boot**: 3.2.0
- **Spring Cloud**: 2023.0.0
- **Java**: 17
- **Maven**: 3.9.5

### Database
- **PostgreSQL**: 16 with PostGIS 3.4
- **Hibernate Spatial**: 6.4.0
- **PostGIS JDBC**: 2023.1.0

### Messaging
- **RabbitMQ**: 3.13

### Caching
- **Redis**: 7.2

### Security
- **Spring Security**
- **JWT (JJWT)**: 0.12.3

### Documentation
- **SpringDoc OpenAPI**: 2.3.0

### Service Discovery
- **Eureka** (Netflix)

---

## Building the Project

### Prerequisites
- JDK 17 or higher
- Maven 3.9+
- Docker and Docker Compose
- PostgreSQL with PostGIS (via Docker)
- RabbitMQ (via Docker)
- Redis (via Docker)

### Build All Services

```bash
cd backend
mvn clean install
```

### Build Individual Service

```bash
cd backend
mvn clean install -pl user-service -am
```

---

## Running Services Locally

### 1. Start Infrastructure Services

First, start PostgreSQL, RabbitMQ, and Redis:

```bash
# From project root
docker-compose up -d
```

This will start:
- PostgreSQL with PostGIS on port 5432
- RabbitMQ on ports 5672 (AMQP) and 15672 (Management UI)
- Redis on port 6379

### 2. Run Individual Services

**User Service**:
```bash
cd backend/user-service
mvn spring-boot:run
```

**Vehicle Service**:
```bash
cd backend/vehicle-service
mvn spring-boot:run
```

**Booking Service**:
```bash
cd backend/booking-service
mvn spring-boot:run
```

---

## Running with Docker

Each service has a Dockerfile. To build and run:

```bash
cd backend
docker build -t user-service -f user-service/Dockerfile .
docker run -p 8081:8081 user-service
```

---

## API Documentation

Each service has Swagger UI documentation available at:

- **User Service**: http://localhost:8081/api/users/swagger-ui.html
- **Vehicle Service**: http://localhost:8082/api/vehicles/swagger-ui.html
- **Booking Service**: http://localhost:8083/api/bookings/swagger-ui.html

OpenAPI JSON:
- http://localhost:8081/api/users/v3/api-docs
- http://localhost:8082/api/vehicles/v3/api-docs
- http://localhost:8083/api/bookings/v3/api-docs

---

## Configuration

Each service can be configured via environment variables:

### Database Configuration
```bash
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=mobility_user
DB_PASSWORD=mobility_password
```

### RabbitMQ Configuration
```bash
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=mobility_user
RABBITMQ_PASSWORD=mobility_password
RABBITMQ_VHOST=mobility_vhost
```

### Redis Configuration
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=mobility_redis_password
```

### JWT Configuration
```bash
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=86400000
```

---

## Testing

Run tests for all services:

```bash
mvn test
```

Run tests for specific service:

```bash
mvn test -pl user-service
```

---

## Inter-Service Communication

### HTTP/REST (Synchronous)
- Using **Spring Cloud OpenFeign**
- Example: Booking Service → Vehicle Service

### RabbitMQ (Asynchronous)
- Event-driven architecture
- Exchanges: `mobility.events` (topic), `mobility.direct`
- Events:
  - `user.registered`
  - `booking.created`, `booking.confirmed`, `booking.cancelled`, `booking.completed`
  - `payment.processing`, `payment.completed`, `payment.failed`
  - `vehicle.status.updated`, `vehicle.location.updated`
  - `driver.assigned`, `driver.location.updated`

---

## Database Schema

Each microservice has its own database:

1. `user_service` - User accounts, profiles, driver licenses
2. `vehicle_service` - Vehicle inventory, locations (PostGIS geometry)
3. `booking_service` - Booking records, reservation details
4. `pricing_service` - Pricing rules, discounts, promotions
5. `driver_service` - Driver profiles, availability, assignments
6. `review_service` - Reviews and ratings
7. `location_service` - Service areas (PostGIS), geofencing
8. `maintenance_service` - Maintenance schedules, service history
9. `payment_service` - (External service - existing)

All databases use:
- PostGIS extensions enabled
- Automatic schema creation/updates (Hibernate DDL)
- Auditing (createdAt, updatedAt, createdBy, updatedBy)
- Optimistic locking (version field)

---

## Common Patterns

### 1. Base Entity
All entities extend `BaseEntity` which provides:
- Auto-generated ID
- Created/Updated timestamps
- Created/Updated by user tracking
- Version for optimistic locking

### 2. API Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ },
  "timestamp": "2025-12-11T20:00:00"
}
```

### 3. Error Response Format
```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "validationErrors": { /* field errors */ }
  },
  "timestamp": "2025-12-11T20:00:00"
}
```

---

## Monitoring & Health Checks

Each service exposes actuator endpoints:

- `/actuator/health` - Health status
- `/actuator/metrics` - Application metrics
- `/actuator/prometheus` - Prometheus metrics

Example:
```bash
curl http://localhost:8081/api/users/actuator/health
```

---

## Development Workflow

1. **Start infrastructure**: `docker-compose up -d`
2. **Verify services are running**: Check RabbitMQ Management UI at http://localhost:15672
3. **Build project**: `mvn clean install`
4. **Run services**: Start each service individually or use IDEs
5. **Test APIs**: Use Swagger UI or Postman
6. **Check logs**: Monitor console output
7. **Stop infrastructure**: `docker-compose down`

---

## Troubleshooting

### Database Connection Issues
- Check PostgreSQL is running: `docker ps`
- Verify database exists: Connect to PostgreSQL and list databases
- Check credentials in `application.yml`

### RabbitMQ Connection Issues
- Check RabbitMQ is running: http://localhost:15672
- Verify virtual host exists: `mobility_vhost`
- Check exchanges and queues are created

### Service Discovery Issues
- Ensure Eureka server is running (if using service discovery)
- Check `eureka.client.enabled` in `application.yml`

### Build Issues
- Clean Maven cache: `mvn clean install -U`
- Check Java version: `java -version` (should be 17+)

---

## Next Steps

To complete the platform:

1. **Complete remaining services**: Pricing, Driver, Review, Location, Maintenance
2. **Implement API Gateway**: Spring Cloud Gateway with routing and authentication
3. **Add gRPC support**: For high-performance inter-service communication
4. **Implement Payment integration**: Connect with existing payment gateway
5. **Add comprehensive testing**: Unit tests, integration tests, E2E tests
6. **Set up CI/CD**: GitHub Actions or Jenkins
7. **Deploy to cloud**: Kubernetes/Docker Swarm deployment
8. **Add monitoring**: ELK stack, Prometheus + Grafana

---

## License

[Specify License]

## Contributors

[Add contributors]

