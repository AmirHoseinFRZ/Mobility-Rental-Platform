# Mobility Rental Platform

## Project Overview

A production-scale mobility rental platform that enables users to rent various mobility vehicles (bikes, scooters, cars, etc.) with flexible rental options - primarily self-service (without driver) and optionally with driver service.

## Architecture Overview

The platform follows a microservices architecture pattern with:
- **Backend**: Spring Boot microservices
- **Frontend**: ReactJS responsive web application
- **Database**: PostgreSQL with PostGIS extension
- **Message Broker**: RabbitMQ for asynchronous communication
- **Communication Protocols**: HTTP REST, gRPC, and RabbitMQ messaging
- **Containerization**: Docker and Docker Compose
- **Payment Processing**: Integrated payment gateway microservice

## Microservices Structure

### 1. API Gateway Service
- Entry point for all client requests
- Routes requests to appropriate microservices
- Handles authentication and authorization
- Rate limiting and request validation
- Load balancing

### 2. User Service
- User registration and authentication
- User profile management
- Driver profile management
- User verification and KYC
- User preferences and settings
- User activity history

### 3. Vehicle Service
- Vehicle catalog management
- Vehicle availability tracking
- Vehicle specifications and categories
- Vehicle maintenance records
- Real-time vehicle status
- Vehicle location tracking (PostGIS)

### 4. Booking Service
- Reservation creation and management
- Booking status tracking
- Booking validation
- Availability checking
- Booking history
- Driver assignment (for with-driver bookings)

### 5. Pricing Service
- Dynamic pricing calculation
- Discount and promotion management
- Pricing rules engine
- Rate calculations (hourly, daily, weekly)
- Surge pricing logic
- Driver service pricing

### 6. Payment Service (Existing)
- Payment processing
- Payment gateway integration
- Transaction management
- Refund processing
- Payment history
- Invoice generation

### 7. Location Service
- Geographic location management (PostGIS)
- Service area definitions
- Pickup/dropoff location management
- Distance and route calculations
- Geofencing
- Location-based search

### 8. Review and Rating Service
- User reviews
- Rating system
- Feedback collection
- Review moderation
- Rating analytics
- Driver ratings (for with-driver service)

### 9. Driver Service
- Driver registration and onboarding
- Driver availability management
- Driver location tracking
- Driver assignment logic
- Driver performance metrics
- Driver schedule management

### 10. Maintenance Service
- Vehicle maintenance scheduling
- Maintenance history
- Service reminders
- Issue reporting
- Maintenance cost tracking
- Vehicle health monitoring

## Technology Stack

### Backend
- **Framework**: Spring Boot
- **Languages**: Java
- **Communication**: REST APIs (HTTP), gRPC, RabbitMQ
- **Security**: Spring Security, JWT
- **API Documentation**: OpenAPI/Swagger

### Frontend
- **Framework**: ReactJS
- **UI Library**: Material-UI / Ant Design / Tailwind CSS
- **State Management**: Redux / Context API
- **Routing**: React Router
- **HTTP Client**: Axios
- **Responsive Design**: Mobile-first approach

### Database
- **Primary Database**: PostgreSQL
- **Geospatial Extension**: PostGIS
- **Connection Pooling**: HikariCP
- **Migration Tools**: Flyway / Liquibase

### Message Broker
- **Broker**: RabbitMQ
- **Patterns**: Event-driven architecture, Pub/Sub, Work queues

### DevOps & Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Service Discovery**: Eureka / Consul
- **Configuration Management**: Spring Cloud Config
- **Monitoring**: Prometheus, Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Tracing**: Zipkin / Jaeger

## Database Design Approach

### Key Database Components

#### User Database
- User accounts and profiles
- Authentication credentials
- User preferences
- Driver profiles
- KYC documents

#### Vehicle Database
- Vehicle inventory
- Vehicle specifications
- Vehicle categories
- Maintenance records
- Vehicle locations (PostGIS geometry)

#### Booking Database
- Active bookings
- Booking history
- Reservation details
- Driver assignments
- Booking status timeline

#### Location Database (PostGIS)
- Service areas (polygons)
- Vehicle locations (points)
- Pickup/dropoff points
- Geofencing zones
- Route history

#### Payment Database
- Transaction records
- Payment methods
- Invoices
- Refunds
- Payment status

## Communication Patterns

### HTTP/REST
- Client to API Gateway
- Synchronous inter-service communication
- External API integrations
- CRUD operations

### gRPC
- High-performance service-to-service calls
- Real-time location updates
- Driver assignment
- Availability checking

### RabbitMQ (Asynchronous Messaging)
- Booking confirmations
- Payment processing events
- Event sourcing
- Saga pattern for distributed transactions
- Inter-service event communication

## Core Features

### User-Facing Features

#### Without Driver (Primary)
- Browse available vehicles by location
- Filter by vehicle type, price range, and features
- Real-time availability checking
- Instant booking and confirmation
- Self-pickup instructions
- GPS-based vehicle unlocking
- Usage tracking
- Self-return process
- Damage reporting

#### With Driver (Optional)
- Browse vehicles with driver service
- Driver profile viewing
- Driver assignment
- Driver tracking in real-time
- Communication with driver
- Driver rating and feedback
- Premium pricing for driver service

#### General Features
- User registration and login
- Profile management
- Search and filtering
- Interactive map view
- Booking management
- Payment processing
- Booking history
- Notifications and alerts
- Reviews and ratings
- Customer support
- Multilingual support
- Multi-currency support

### Admin Features
- Vehicle management
- User management
- Driver management
- Booking oversight
- Pricing configuration
- Service area management
- Analytics dashboard
- Revenue tracking
- Maintenance scheduling
- Review moderation
- System configuration

## Project Structure

```
mobility-rental-platform/
├── backend/                     ✅ COMPLETE (100%)
│   ├── api-gateway/            # Port 8080 - Spring Cloud Gateway
│   ├── user-service/           # Port 8081 - User management
│   ├── vehicle-service/        # Port 8082 - Vehicle inventory (PostGIS)
│   ├── booking-service/        # Port 8083 - Booking management
│   ├── pricing-service/        # Port 8084 - Dynamic pricing
│   ├── driver-service/         # Port 8085 - Driver management (PostGIS)
│   ├── review-service/         # Port 8086 - Reviews & ratings
│   ├── location-service/       # Port 8087 - Location services (PostGIS)
│   ├── maintenance-service/    # Port 8088 - Maintenance tracking
│   ├── common-lib/             # Shared utilities
│   ├── pom.xml                 # Root Maven POM
│   └── README.md               # Backend documentation
├── frontend/                    ✅ COMPLETE (100%)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components (9 pages)
│   │   ├── context/            # React Context (Auth)
│   │   └── services/           # API service layer
│   ├── public/                 # Static files
│   ├── package.json            # Dependencies
│   ├── Dockerfile              # Docker build
│   ├── nginx.conf              # Production server config
│   └── README.md               # Frontend documentation
├── infrastructure/              ✅ COMPLETE (100%)
│   └── docker/
│       ├── postgres/           # PostgreSQL + PostGIS
│       ├── rabbitmq/           # RabbitMQ configuration
│       ├── redis/              # Redis configuration
│       └── README.md           # Infrastructure guide
├── docker-compose.yml          ✅ Infrastructure services
├── env.example                 # Environment variables template
├── README.md                   # This file
├── BACKEND_COMPLETE.md         # Backend completion summary
└── FINAL_IMPLEMENTATION_SUMMARY.md  # Complete project summary
```

## Deployment Architecture

### Containerization
- Each microservice runs in its own Docker container
- PostgreSQL with PostGIS in a dedicated container
- RabbitMQ in a dedicated container
- Frontend served via Nginx container
- Docker Compose for local development and testing
- Docker networks for service isolation

### Service Dependencies
- All services connect to PostgreSQL (with separate databases or schemas)
- All services connect to RabbitMQ for messaging
- Services register with Service Discovery
- API Gateway as the single entry point
- Configuration server for centralized config management

### Scalability
- Horizontal scaling of microservices
- Database connection pooling
- Caching layer (Redis) for frequently accessed data
- Load balancing at API Gateway
- Message queue for handling traffic spikes

## Development Workflow

### Local Development
1. Clone repository
2. Run Docker Compose to start infrastructure (PostgreSQL, RabbitMQ)
3. Start individual microservices
4. Start frontend development server
5. Access via API Gateway

### Testing Strategy
- Unit tests for business logic
- Integration tests for service interactions
- End-to-end tests for critical user flows
- Load testing for performance validation
- Contract testing for inter-service communication

### CI/CD Pipeline
- Automated testing on commit
- Docker image building
- Container registry push
- Automated deployment to staging
- Manual approval for production
- Rollback capabilities

## Security Considerations

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- OAuth2 integration options
- API key management for admin operations

### Data Security
- Encrypted data at rest
- TLS/SSL for data in transit
- Secure payment processing (PCI compliance)
- Personal data protection (GDPR compliance)
- Database encryption
- Secure credential management

### API Security
- Rate limiting
- Request validation
- API versioning
- CORS configuration
- Input sanitization
- SQL injection prevention

## Monitoring & Observability

### Metrics
- Service health checks
- Performance metrics
- Business metrics (bookings, revenue)
- Error rates
- Response times

### Logging
- Centralized logging
- Structured logging format
- Log aggregation
- Log retention policies
- Searchable logs

### Tracing
- Distributed tracing
- Request correlation IDs
- Performance bottleneck identification
- Service dependency mapping

## PostGIS Use Cases

### Location-Based Operations
- Finding available vehicles within radius
- Service area boundary checking
- Route distance calculations
- Geofencing for restricted zones
- Heat maps for demand analysis
- Optimal vehicle distribution
- Driver proximity matching

### Spatial Queries
- Point in polygon (is user in service area?)
- Distance calculations
- Nearest vehicle search
- Coverage area optimization
- Location-based pricing zones

## Business Logic Highlights

### Booking Flow (Without Driver)
1. User searches for vehicles by location
2. System shows available vehicles with pricing
3. User selects vehicle and time slot
4. System validates availability
5. System calculates price
6. User confirms and makes payment
7. Booking confirmed, vehicle reserved
8. User receives pickup instructions
9. User unlocks vehicle at pickup time
10. Usage tracking begins
11. User returns vehicle and locks
12. System calculates final charges
13. Transaction completed

### Booking Flow (With Driver)
1. User searches for vehicles with driver option
2. System shows available vehicles and drivers
3. User selects vehicle, driver preference, and time
4. System assigns suitable driver
5. System calculates price (including driver fee)
6. User confirms and makes payment
7. Driver notified and accepts
8. User and driver connected
9. Driver picks up user at specified location
10. Journey tracking
11. Driver completes journey
12. User rates driver and vehicle
13. Transaction completed

## Future Enhancements

### Phase 2 Features
- Mobile applications (iOS and Android)
- AI-based demand forecasting
- Dynamic vehicle redistribution
- Loyalty programs
- Corporate accounts
- Subscription models
- Electric vehicle charging station integration

### Phase 3 Features
- Multi-modal transportation integration
- Carbon footprint tracking
- Social features (ride sharing)
- Insurance integration
- Blockchain-based transaction logging
- Machine learning for pricing optimization

## Getting Started

### Prerequisites
- Docker and Docker Compose installed
- Java Development Kit (JDK 17 or higher)
- Node.js 18+ and npm
- Maven 3.9+
- Git

### Quick Start

#### 1. Clone Repository
```bash
git clone https://github.com/AmirHoseinFRZ/Mobility-Rental-Platform.git
cd Mobility-Rental-Platform
```

#### 2. Start Infrastructure (PostgreSQL, RabbitMQ, Redis)
```bash
docker-compose up -d
```

#### 3. Build and Run Backend Services
```bash
cd backend
mvn clean install

# Start API Gateway (Port 8080) - REQUIRED
cd api-gateway && mvn spring-boot:run

# Start other services (in separate terminals)
cd user-service && mvn spring-boot:run       # Port 8081
cd vehicle-service && mvn spring-boot:run    # Port 8082
cd booking-service && mvn spring-boot:run    # Port 8083
cd pricing-service && mvn spring-boot:run    # Port 8084
cd driver-service && mvn spring-boot:run     # Port 8085
cd review-service && mvn spring-boot:run     # Port 8086
```

#### 4. Start Frontend Application
```bash
cd frontend
npm install
npm start
```

#### 5. Access the Application
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Swagger Docs**: http://localhost:808{1-8}/api/{service}/swagger-ui.html
- **RabbitMQ Management**: http://localhost:15672

### Default Credentials
- **Database**: mobility_user / mobility_password
- **RabbitMQ**: mobility_user / mobility_password
- **Redis**: mobility_redis_password

## Support and Documentation

### Documentation Structure
- API documentation (Swagger/OpenAPI)
- Architecture decision records (ADR)
- Database schema documentation
- Deployment guides
- User manuals
- Admin guides
- Developer onboarding guide

## Contributing

- Code review process
- Coding standards
- Git workflow (feature branches, pull requests)
- Testing requirements
- Documentation requirements

## License

[Specify your license here]

---

**Project Status**: In Development
**Version**: 1.0.0
**Last Updated**: December 2025

