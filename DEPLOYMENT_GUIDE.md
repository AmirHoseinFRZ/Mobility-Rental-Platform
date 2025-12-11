# Mobility Rental Platform - Production Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Deployment](#local-development-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Cloud Deployment (AWS)](#cloud-deployment-aws)
6. [Cloud Deployment (Azure)](#cloud-deployment-azure)
7. [Kubernetes Deployment](#kubernetes-deployment)
8. [Environment Configuration](#environment-configuration)
9. [Security Considerations](#security-considerations)
10. [Monitoring & Logging](#monitoring--logging)
11. [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers deploying the Mobility Rental Platform in various environments:
- Local development
- Docker containers
- Cloud providers (AWS, Azure, GCP)
- Kubernetes orchestration

---

## Prerequisites

### Required Software
- Docker 24.0+
- Docker Compose 2.0+
- JDK 17+
- Maven 3.9+
- Node.js 18+
- Git

### Required Accounts (For Cloud Deployment)
- AWS Account with CLI configured
- Or Azure Account with CLI
- Or GCP Account with CLI
- Domain name (optional, for production)
- SSL certificates (Let's Encrypt recommended)

---

## Local Development Deployment

### Step 1: Clone Repository

```bash
git clone https://github.com/AmirHoseinFRZ/Mobility-Rental-Platform.git
cd Mobility-Rental-Platform
```

### Step 2: Start Infrastructure Services

```bash
# Start PostgreSQL, RabbitMQ, Redis
docker-compose up -d

# Verify services are running
docker ps

# Check PostgreSQL
docker exec -it mobility-postgres psql -U mobility_user -d mobility_platform -c "\l"

# Check RabbitMQ
curl http://localhost:15672 # Should see RabbitMQ UI
```

### Step 3: Build Backend Services

```bash
cd backend
mvn clean install

# This will:
# - Compile all Java code
# - Run unit tests
# - Package each service as JAR
```

### Step 4: Run Backend Services

**Option A: Run each service in separate terminal**

```bash
# Terminal 1 - API Gateway (REQUIRED - Port 8080)
cd backend/api-gateway
mvn spring-boot:run

# Terminal 2 - User Service (Port 8081)
cd backend/user-service
mvn spring-boot:run

# Terminal 3 - Vehicle Service (Port 8082)
cd backend/vehicle-service
mvn spring-boot:run

# Terminal 4 - Booking Service (Port 8083)
cd backend/booking-service
mvn spring-boot:run

# Terminal 5 - Pricing Service (Port 8084)
cd backend/pricing-service
mvn spring-boot:run

# Terminal 6 - Driver Service (Port 8085)
cd backend/driver-service
mvn spring-boot:run

# Terminal 7 - Review Service (Port 8086)
cd backend/review-service
mvn spring-boot:run

# Terminal 8 - Location Service (Port 8087)
cd backend/location-service
mvn spring-boot:run

# Terminal 9 - Maintenance Service (Port 8088)
cd backend/maintenance-service
mvn spring-boot:run
```

**Option B: Use tmux or screen for multiple terminals**

```bash
# Install tmux (Ubuntu/Debian)
sudo apt-get install tmux

# Start all services in tmux
./scripts/start-all-services.sh  # Create this script
```

### Step 5: Run Frontend

```bash
cd frontend
npm install
npm start
```

Application will be available at:
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080

---

## Docker Deployment

### Step 1: Create Complete Docker Compose

Create `docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  # Infrastructure (from existing docker-compose.yml)
  postgres:
    image: postgis/postgis:16-3.4
    container_name: mobility-postgres
    restart: always
    environment:
      POSTGRES_USER: mobility_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-change-in-production}
      POSTGRES_DB: mobility_platform
      POSTGRES_MULTIPLE_DATABASES: user_service,vehicle_service,booking_service,pricing_service,driver_service,review_service,location_service,maintenance_service
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infrastructure/docker/postgres/init:/docker-entrypoint-initdb.d
    networks:
      - mobility-network

  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    container_name: mobility-rabbitmq
    restart: always
    environment:
      RABBITMQ_DEFAULT_USER: mobility_user
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD:-change-in-production}
      RABBITMQ_DEFAULT_VHOST: mobility_vhost
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
      - ./infrastructure/docker/rabbitmq/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf
      - ./infrastructure/docker/rabbitmq/definitions.json:/etc/rabbitmq/definitions.json
    networks:
      - mobility-network

  redis:
    image: redis:7.2-alpine
    container_name: mobility-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD:-change-in-production} --maxmemory 512mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - mobility-network

  # Backend Services
  api-gateway:
    build:
      context: ./backend
      dockerfile: api-gateway/Dockerfile
    container_name: api-gateway
    restart: always
    ports:
      - "8080:8080"
    environment:
      - EUREKA_SERVER=http://eureka-server:8761/eureka/
    networks:
      - mobility-network
    depends_on:
      - postgres
      - rabbitmq
      - redis

  user-service:
    build:
      context: ./backend
      dockerfile: user-service/Dockerfile
    container_name: user-service
    restart: always
    ports:
      - "8081:8081"
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USERNAME=mobility_user
      - DB_PASSWORD=${POSTGRES_PASSWORD:-change-in-production}
      - RABBITMQ_HOST=rabbitmq
      - RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD:-change-in-production}
      - REDIS_HOST=redis
      - REDIS_PASSWORD=${REDIS_PASSWORD:-change-in-production}
      - JWT_SECRET=${JWT_SECRET:-change-this-secret-in-production}
    networks:
      - mobility-network
    depends_on:
      - postgres
      - rabbitmq
      - redis

  vehicle-service:
    build:
      context: ./backend
      dockerfile: vehicle-service/Dockerfile
    container_name: vehicle-service
    restart: always
    ports:
      - "8082:8082"
    environment:
      - DB_HOST=postgres
      - DB_PASSWORD=${POSTGRES_PASSWORD:-change-in-production}
      - RABBITMQ_HOST=rabbitmq
      - RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD:-change-in-production}
      - REDIS_HOST=redis
      - REDIS_PASSWORD=${REDIS_PASSWORD:-change-in-production}
    networks:
      - mobility-network
    depends_on:
      - postgres

  booking-service:
    build:
      context: ./backend
      dockerfile: booking-service/Dockerfile
    container_name: booking-service
    restart: always
    ports:
      - "8083:8083"
    environment:
      - DB_HOST=postgres
      - DB_PASSWORD=${POSTGRES_PASSWORD:-change-in-production}
      - RABBITMQ_HOST=rabbitmq
      - RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD:-change-in-production}
      - REDIS_HOST=redis
      - REDIS_PASSWORD=${REDIS_PASSWORD:-change-in-production}
    networks:
      - mobility-network
    depends_on:
      - postgres
      - vehicle-service

  pricing-service:
    build:
      context: ./backend
      dockerfile: pricing-service/Dockerfile
    container_name: pricing-service
    restart: always
    ports:
      - "8084:8084"
    environment:
      - DB_HOST=postgres
      - DB_PASSWORD=${POSTGRES_PASSWORD:-change-in-production}
      - REDIS_HOST=redis
      - REDIS_PASSWORD=${REDIS_PASSWORD:-change-in-production}
    networks:
      - mobility-network
    depends_on:
      - postgres

  driver-service:
    build:
      context: ./backend
      dockerfile: driver-service/Dockerfile
    container_name: driver-service
    restart: always
    ports:
      - "8085:8085"
    environment:
      - DB_HOST=postgres
      - DB_PASSWORD=${POSTGRES_PASSWORD:-change-in-production}
      - REDIS_HOST=redis
      - REDIS_PASSWORD=${REDIS_PASSWORD:-change-in-production}
    networks:
      - mobility-network
    depends_on:
      - postgres

  review-service:
    build:
      context: ./backend
      dockerfile: review-service/Dockerfile
    container_name: review-service
    restart: always
    ports:
      - "8086:8086"
    environment:
      - DB_HOST=postgres
      - DB_PASSWORD=${POSTGRES_PASSWORD:-change-in-production}
      - REDIS_HOST=redis
      - REDIS_PASSWORD=${REDIS_PASSWORD:-change-in-production}
    networks:
      - mobility-network
    depends_on:
      - postgres

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: mobility-frontend
    restart: always
    ports:
      - "80:80"
    environment:
      - REACT_APP_API_URL=http://api-gateway:8080
    networks:
      - mobility-network
    depends_on:
      - api-gateway

networks:
  mobility-network:
    driver: bridge

volumes:
  postgres_data:
  rabbitmq_data:
  redis_data:
```

### Step 2: Build All Images

```bash
# Build backend services
cd backend
docker build -t user-service -f user-service/Dockerfile .
docker build -t vehicle-service -f vehicle-service/Dockerfile .
docker build -t booking-service -f booking-service/Dockerfile .
docker build -t pricing-service -f pricing-service/Dockerfile .
docker build -t driver-service -f driver-service/Dockerfile .
docker build -t review-service -f review-service/Dockerfile .
docker build -t api-gateway -f api-gateway/Dockerfile .

# Build frontend
cd ../frontend
docker build -t mobility-frontend .
```

### Step 3: Run with Docker Compose

```bash
# Create production environment file
cp env.example .env.production

# Edit .env.production with secure passwords
nano .env.production

# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check logs
docker-compose -f docker-compose.production.yml logs -f

# Check service health
docker ps
```

### Step 4: Access Application

- **Frontend**: http://localhost
- **API Gateway**: http://localhost:8080
- **RabbitMQ UI**: http://localhost:15672

---

## Cloud Deployment (AWS)

### Architecture

```
                                [Route 53 DNS]
                                      ↓
                              [Application Load Balancer]
                                      ↓
                    [Target Groups - Health Checks]
                                      ↓
        ┌─────────────────────────────┴─────────────────────────────┐
        ↓                             ↓                              ↓
   [ECS Cluster]              [ECS Cluster]                    [ECS Cluster]
   API Gateway                Backend Services                 Frontend
        ↓                             ↓                              ↓
        └──────────────────────[RDS PostgreSQL + PostGIS]───────────┘
                                      ↓
                         [Amazon MQ (RabbitMQ)]
                                      ↓
                         [ElastiCache (Redis)]
```

### Step 1: Setup AWS Infrastructure

#### 1.1 Create VPC and Subnets

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=mobility-vpc}]'

# Create subnets (public and private)
aws ec2 create-subnet --vpc-id vpc-xxxxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxxxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b
```

#### 1.2 Create RDS PostgreSQL with PostGIS

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier mobility-postgres \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 16.1 \
  --master-username mobility_admin \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 100 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name mobility-db-subnet \
  --backup-retention-period 7 \
  --storage-encrypted \
  --multi-az

# After RDS is created, connect and enable PostGIS
psql -h mobility-postgres.xxxxx.us-east-1.rds.amazonaws.com \
     -U mobility_admin \
     -d postgres

postgres=> CREATE EXTENSION postgis;
postgres=> CREATE EXTENSION postgis_topology;

# Create all required databases
CREATE DATABASE user_service;
CREATE DATABASE vehicle_service;
CREATE DATABASE booking_service;
CREATE DATABASE pricing_service;
CREATE DATABASE driver_service;
CREATE DATABASE review_service;
CREATE DATABASE location_service;
CREATE DATABASE maintenance_service;

# Enable PostGIS on each database
\c vehicle_service
CREATE EXTENSION postgis;

\c driver_service
CREATE EXTENSION postgis;

\c location_service
CREATE EXTENSION postgis;
```

#### 1.3 Create Amazon MQ (RabbitMQ)

```bash
aws mq create-broker \
  --broker-name mobility-rabbitmq \
  --engine-type RABBITMQ \
  --engine-version 3.13 \
  --host-instance-type mq.t3.micro \
  --users "Username=mobility_user,Password=SecurePassword123!" \
  --deployment-mode SINGLE_INSTANCE \
  --publicly-accessible
```

#### 1.4 Create ElastiCache (Redis)

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id mobility-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxxxx
```

### Step 2: Setup Container Registry (ECR)

```bash
# Create ECR repositories for each service
aws ecr create-repository --repository-name mobility/api-gateway
aws ecr create-repository --repository-name mobility/user-service
aws ecr create-repository --repository-name mobility/vehicle-service
aws ecr create-repository --repository-name mobility/booking-service
aws ecr create-repository --repository-name mobility/pricing-service
aws ecr create-repository --repository-name mobility/driver-service
aws ecr create-repository --repository-name mobility/review-service
aws ecr create-repository --repository-name mobility/location-service
aws ecr create-repository --repository-name mobility/maintenance-service
aws ecr create-repository --repository-name mobility/frontend

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

### Step 3: Build and Push Docker Images

```bash
# Build and tag images
cd backend

# User Service
docker build -t mobility/user-service:latest -f user-service/Dockerfile .
docker tag mobility/user-service:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/mobility/user-service:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/mobility/user-service:latest

# Repeat for all services...
# Or use a script:

#!/bin/bash
ACCOUNT_ID=<your-aws-account-id>
REGION=us-east-1
REGISTRY=$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

SERVICES=(api-gateway user-service vehicle-service booking-service pricing-service driver-service review-service location-service maintenance-service)

for service in "${SERVICES[@]}"; do
  echo "Building $service..."
  docker build -t mobility/$service:latest -f $service/Dockerfile .
  docker tag mobility/$service:latest $REGISTRY/mobility/$service:latest
  docker push $REGISTRY/mobility/$service:latest
done

# Build and push frontend
cd ../frontend
docker build -t mobility/frontend:latest .
docker tag mobility/frontend:latest $REGISTRY/mobility/frontend:latest
docker push $REGISTRY/mobility/frontend:latest
```

### Step 4: Deploy to ECS (Elastic Container Service)

#### 4.1 Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name mobility-cluster
```

#### 4.2 Create Task Definitions

Create `task-definition-user-service.json`:

```json
{
  "family": "user-service",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "user-service",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/mobility/user-service:latest",
      "portMappings": [
        {
          "containerPort": 8081,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "DB_HOST", "value": "mobility-postgres.xxxxx.rds.amazonaws.com"},
        {"name": "DB_USERNAME", "value": "mobility_admin"},
        {"name": "RABBITMQ_HOST", "value": "b-xxxxx.mq.us-east-1.amazonaws.com"},
        {"name": "REDIS_HOST", "value": "mobility-redis.xxxxx.cache.amazonaws.com"}
      ],
      "secrets": [
        {"name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:us-east-1:xxxxx:secret:db-password"},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:us-east-1:xxxxx:secret:jwt-secret"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/user-service",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:8081/api/users/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

Register task definition:

```bash
aws ecs register-task-definition --cli-input-json file://task-definition-user-service.json

# Repeat for all services
```

#### 4.3 Create ECS Services

```bash
aws ecs create-service \
  --cluster mobility-cluster \
  --service-name user-service \
  --task-definition user-service \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:xxxxx:targetgroup/user-service/xxxxx,containerName=user-service,containerPort=8081"

# Repeat for all services
```

### Step 5: Setup Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name mobility-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing

# Create target groups for each service
aws elbv2 create-target-group \
  --name user-service-tg \
  --protocol HTTP \
  --port 8081 \
  --vpc-id vpc-xxxxx \
  --target-type ip \
  --health-check-path /api/users/health

# Create listeners and rules
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...

# Add path-based routing rules
aws elbv2 create-rule \
  --listener-arn arn:aws:elasticloadbalancing:... \
  --conditions Field=path-pattern,Values='/api/users/*' \
  --priority 1 \
  --actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:.../user-service-tg
```

### Step 6: Configure SSL/TLS (HTTPS)

```bash
# Request certificate from ACM (AWS Certificate Manager)
aws acm request-certificate \
  --domain-name mobility.yourdomain.com \
  --validation-method DNS \
  --subject-alternative-names '*.mobility.yourdomain.com'

# Add HTTPS listener to ALB
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=...
```

### Step 7: Deploy Frontend to S3 + CloudFront (Alternative)

```bash
# Build frontend
cd frontend
npm run build

# Create S3 bucket
aws s3 mb s3://mobility-platform-frontend

# Upload build files
aws s3 sync build/ s3://mobility-platform-frontend --delete

# Enable static website hosting
aws s3 website s3://mobility-platform-frontend --index-document index.html --error-document index.html

# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name mobility-platform-frontend.s3.amazonaws.com \
  --default-root-object index.html
```

---

## Cloud Deployment (Azure)

### Step 1: Azure Container Registry

```bash
# Create resource group
az group create --name mobility-rg --location eastus

# Create container registry
az acr create --resource-group mobility-rg --name mobilityregistry --sku Basic

# Login to ACR
az acr login --name mobilityregistry

# Build and push images
az acr build --registry mobilityregistry --image user-service:latest -f backend/user-service/Dockerfile backend/
# Repeat for all services
```

### Step 2: Azure Database for PostgreSQL

```bash
# Create PostgreSQL server
az postgres server create \
  --resource-group mobility-rg \
  --name mobility-postgres \
  --location eastus \
  --admin-user mobility_admin \
  --admin-password SecurePassword123! \
  --sku-name GP_Gen5_2 \
  --version 16

# Enable PostGIS extension
az postgres server configuration set \
  --resource-group mobility-rg \
  --server-name mobility-postgres \
  --name azure.extensions \
  --value POSTGIS

# Create databases
az postgres db create --resource-group mobility-rg --server-name mobility-postgres --name user_service
# Repeat for all databases
```

### Step 3: Deploy to Azure Container Instances (ACI)

```bash
# Deploy services
az container create \
  --resource-group mobility-rg \
  --name user-service \
  --image mobilityregistry.azurecr.io/user-service:latest \
  --cpu 1 \
  --memory 1 \
  --registry-login-server mobilityregistry.azurecr.io \
  --registry-username mobilityregistry \
  --registry-password <password> \
  --ports 8081 \
  --environment-variables \
    DB_HOST=mobility-postgres.postgres.database.azure.com \
    DB_PASSWORD=SecurePassword123!

# Repeat for all services
```

### Step 4: Setup Application Gateway

```bash
# Create application gateway for routing
az network application-gateway create \
  --name mobility-app-gateway \
  --resource-group mobility-rg \
  --location eastus \
  --capacity 2 \
  --sku Standard_v2 \
  --http-settings-cookie-based-affinity Disabled \
  --frontend-port 80 \
  --routing-rule-type Basic
```

---

## Kubernetes Deployment

### Step 1: Create Kubernetes Manifests

Create `k8s/namespace.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: mobility-platform
```

Create `k8s/configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mobility-config
  namespace: mobility-platform
data:
  DB_HOST: "postgres-service"
  RABBITMQ_HOST: "rabbitmq-service"
  REDIS_HOST: "redis-service"
  EUREKA_SERVER: "http://eureka-service:8761/eureka/"
```

Create `k8s/secrets.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mobility-secrets
  namespace: mobility-platform
type: Opaque
stringData:
  DB_PASSWORD: "change-in-production"
  RABBITMQ_PASSWORD: "change-in-production"
  REDIS_PASSWORD: "change-in-production"
  JWT_SECRET: "change-in-production"
```

Create `k8s/user-service-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: mobility-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: <registry>/mobility/user-service:latest
        ports:
        - containerPort: 8081
        envFrom:
        - configMapRef:
            name: mobility-config
        - secretRef:
            name: mobility-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/users/health
            port: 8081
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/users/health
            port: 8081
          initialDelaySeconds: 30
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: mobility-platform
spec:
  selector:
    app: user-service
  ports:
  - protocol: TCP
    port: 8081
    targetPort: 8081
  type: ClusterIP
```

### Step 2: Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create config and secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# Deploy infrastructure
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/rabbitmq-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml

# Deploy backend services
kubectl apply -f k8s/api-gateway-deployment.yaml
kubectl apply -f k8s/user-service-deployment.yaml
kubectl apply -f k8s/vehicle-service-deployment.yaml
kubectl apply -f k8s/booking-service-deployment.yaml
kubectl apply -f k8s/pricing-service-deployment.yaml
kubectl apply -f k8s/driver-service-deployment.yaml
kubectl apply -f k8s/review-service-deployment.yaml

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml

# Deploy ingress
kubectl apply -f k8s/ingress.yaml
```

### Step 3: Setup Ingress Controller

Create `k8s/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mobility-ingress
  namespace: mobility-platform
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - mobility.yourdomain.com
    secretName: mobility-tls
  rules:
  - host: mobility.yourdomain.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 8080
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
```

### Step 4: Install Cert-Manager (SSL)

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
kubectl apply -f k8s/cert-issuer.yaml
```

---

## Environment Configuration

### Production Environment Variables

Create `.env.production`:

```bash
# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=mobility_admin
DB_PASSWORD=<secure-password>

# RabbitMQ
RABBITMQ_HOST=your-rabbitmq-host
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=mobility_admin
RABBITMQ_PASSWORD=<secure-password>
RABBITMQ_VHOST=mobility_vhost

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=<secure-password>

# JWT
JWT_SECRET=<generate-secure-random-string-256-bits>
JWT_EXPIRATION=86400000

# Payment Gateway
PAYMENT_SERVICE_URL=https://your-payment-gateway.com/api

# Frontend
REACT_APP_API_URL=https://api.mobility.yourdomain.com

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true

# Logging
LOG_LEVEL=INFO
```

### Generate Secure Secrets

```bash
# Generate JWT secret (256-bit)
openssl rand -base64 32

# Generate database password
openssl rand -base64 24

# Generate RabbitMQ password
openssl rand -base64 24

# Generate Redis password
openssl rand -base64 24
```

---

## Security Considerations

### 1. Database Security

```bash
# Use SSL connections
spring.datasource.url=jdbc:postgresql://host:5432/db?ssl=true&sslmode=require

# Encrypt data at rest
aws rds modify-db-instance --db-instance-identifier mobility-postgres --storage-encrypted

# Regular backups
aws rds create-db-snapshot --db-instance-identifier mobility-postgres --db-snapshot-identifier mobility-backup-$(date +%Y%m%d)
```

### 2. API Security

- ✅ Enable HTTPS (TLS 1.3)
- ✅ Use strong JWT secrets
- ✅ Implement rate limiting at API Gateway
- ✅ Enable CORS with specific origins only
- ✅ Use secrets manager (AWS Secrets Manager, Azure Key Vault)
- ✅ Enable API key authentication for admin endpoints

### 3. Network Security

- ✅ Use private subnets for backend services
- ✅ Security groups with least privilege
- ✅ VPC peering for service communication
- ✅ WAF (Web Application Firewall) on ALB
- ✅ DDoS protection (AWS Shield, Cloudflare)

### 4. Payment Security

- ✅ PCI DSS compliance
- ✅ Never store credit card data
- ✅ Use payment gateway tokenization
- ✅ Verify all transactions server-side
- ✅ Log all payment attempts
- ✅ Monitor for fraud patterns

---

## Monitoring & Logging

### Prometheus + Grafana Setup

#### 1. Deploy Prometheus

Create `k8s/prometheus-deployment.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
      - job_name: 'spring-boot'
        metrics_path: '/actuator/prometheus'
        static_configs:
          - targets:
            - 'user-service:8081'
            - 'vehicle-service:8082'
            - 'booking-service:8083'
            - 'pricing-service:8084'
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
      volumes:
      - name: config
        configMap:
          name: prometheus-config
```

#### 2. Deploy Grafana

```bash
kubectl apply -f k8s/grafana-deployment.yaml

# Import pre-built dashboards:
# - Spring Boot dashboard
# - JVM metrics
# - Database metrics
# - RabbitMQ metrics
```

### ELK Stack (Elasticsearch, Logstash, Kibana)

```bash
# Deploy ELK stack
kubectl apply -f k8s/elk-stack.yaml

# Configure Spring Boot to send logs to Logstash
# Add to application.yml:
logging:
  config: classpath:logback-spring.xml
  
# Update services to use logstash appender
```

### CloudWatch (AWS)

```bash
# Enable CloudWatch Container Insights
aws ecs update-cluster-settings \
  --cluster mobility-cluster \
  --settings name=containerInsights,value=enabled

# Create log groups
aws logs create-log-group --log-group-name /ecs/user-service
aws logs create-log-group --log-group-name /ecs/vehicle-service
# ... for all services
```

---

## Scaling Configuration

### Horizontal Pod Autoscaling (Kubernetes)

Create `k8s/hpa.yaml`:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
  namespace: mobility-platform
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

Apply:

```bash
kubectl apply -f k8s/hpa.yaml
```

### ECS Auto Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/mobility-cluster/user-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/mobility-cluster/user-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

---

## Database Backup & Recovery

### Automated Backups

#### AWS RDS

```bash
# Enable automated backups (retention 7 days)
aws rds modify-db-instance \
  --db-instance-identifier mobility-postgres \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"

# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier mobility-postgres \
  --db-snapshot-identifier mobility-snapshot-$(date +%Y%m%d)

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier mobility-postgres-restored \
  --db-snapshot-identifier mobility-snapshot-20251211
```

#### Manual Backup Script

```bash
#!/bin/bash
# backup-databases.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_HOST="localhost"
DB_USER="mobility_user"

DATABASES=(user_service vehicle_service booking_service pricing_service driver_service review_service location_service maintenance_service)

for db in "${DATABASES[@]}"; do
  echo "Backing up $db..."
  pg_dump -h $DB_HOST -U $DB_USER $db > $BACKUP_DIR/${db}_${TIMESTAMP}.sql
  gzip $BACKUP_DIR/${db}_${TIMESTAMP}.sql
done

# Upload to S3
aws s3 sync $BACKUP_DIR/ s3://mobility-backups/databases/

# Clean up old backups (keep last 30 days)
find $BACKUP_DIR -type f -mtime +30 -delete
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Mobility Platform

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Build and Test Backend
        run: |
          cd backend
          mvn clean test
      
      - name: SonarQube Scan
        run: mvn sonar:sonar -Dsonar.projectKey=mobility-platform

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install and Test Frontend
        run: |
          cd frontend
          npm install
          npm test -- --coverage

  build-and-push:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push images
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          # Build backend services
          cd backend
          docker build -t $ECR_REGISTRY/mobility/user-service:${{ github.sha }} -f user-service/Dockerfile .
          docker push $ECR_REGISTRY/mobility/user-service:${{ github.sha }}
          
          # Repeat for all services...
          
          # Build frontend
          cd ../frontend
          docker build -t $ECR_REGISTRY/mobility/frontend:${{ github.sha }} .
          docker push $ECR_REGISTRY/mobility/frontend:${{ github.sha }}
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster mobility-cluster --service user-service --force-new-deployment
          # Repeat for all services

  deploy-frontend:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Frontend
        run: |
          cd frontend
          npm install
          npm run build
      
      - name: Deploy to S3
        run: |
          aws s3 sync frontend/build/ s3://mobility-platform-frontend --delete
      
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_ID }} --paths "/*"
```

---

## Performance Optimization

### 1. Database Optimization

```sql
-- Create indexes for frequently queried fields
CREATE INDEX idx_vehicles_location ON vehicles USING GIST (current_location);
CREATE INDEX idx_drivers_location ON drivers USING GIST (current_location);
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX idx_bookings_vehicle_dates ON bookings(vehicle_id, start_date_time, end_date_time);

-- Analyze tables
ANALYZE vehicles;
ANALYZE bookings;
ANALYZE users;
```

### 2. Redis Caching Strategy

```java
// Cache vehicle search results
@Cacheable(value = "vehicles", key = "#lat + '-' + #lon + '-' + #radius")
public List<VehicleResponse> searchByLocation(double lat, double lon, double radius) {
    // ...
}

// Cache pricing rules
@Cacheable(value = "pricing-rules", key = "#vehicleType")
public PricingRule getPricingRule(String vehicleType) {
    // ...
}

// Clear cache on updates
@CacheEvict(value = "vehicles", allEntries = true)
public void updateVehicle(Long id, VehicleRequest request) {
    // ...
}
```

### 3. Database Connection Pooling

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 10
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      leak-detection-threshold: 60000
```

### 4. Frontend Optimization

```bash
# Production build optimizations
npm run build

# Analyze bundle size
npm install -g source-map-explorer
source-map-explorer 'build/static/js/*.js'

# Enable compression in Nginx
gzip on;
gzip_types text/css application/javascript application/json;

# Enable browser caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## Disaster Recovery Plan

### 1. Backup Strategy

**Databases**: 
- Automated daily backups (RDS)
- Point-in-time recovery enabled
- Cross-region replication

**Application**:
- Container images in multiple regions
- Configuration in version control
- Secrets in AWS Secrets Manager

### 2. Recovery Procedures

#### Database Recovery

```bash
# Restore RDS from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier mobility-postgres-restored \
  --db-snapshot-identifier latest-snapshot

# Point-in-time recovery
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier mobility-postgres \
  --target-db-instance-identifier mobility-postgres-restored \
  --restore-time 2025-12-11T10:00:00Z
```

#### Service Recovery

```bash
# Redeploy services from images
kubectl rollout restart deployment/user-service -n mobility-platform

# Or ECS
aws ecs update-service --cluster mobility-cluster --service user-service --force-new-deployment
```

### 3. Rollback Procedures

```bash
# Kubernetes rollback
kubectl rollout undo deployment/user-service -n mobility-platform

# ECS rollback
aws ecs update-service \
  --cluster mobility-cluster \
  --service user-service \
  --task-definition user-service:previous-version
```

---

## Load Balancing & High Availability

### AWS Setup

```
                    [Route 53]
                        ↓
              [Application Load Balancer]
              (Health checks, SSL termination)
                        ↓
        ┌───────────────┴───────────────┐
        ↓                               ↓
   [AZ 1: us-east-1a]            [AZ 2: us-east-1b]
   - ECS Tasks (Services)         - ECS Tasks (Services)
   - Auto Scaling (2-10)          - Auto Scaling (2-10)
        ↓                               ↓
        └───────────────┬───────────────┘
                        ↓
                [RDS Multi-AZ]
              (Primary + Standby)
```

### Health Checks

All services have health check endpoints:

```bash
# Check service health
curl http://api-gateway:8080/actuator/health
curl http://user-service:8081/api/users/health
curl http://vehicle-service:8082/api/vehicles/health
# ... for all services
```

---

## Troubleshooting

### Common Issues

#### 1. Service Won't Start

```bash
# Check logs
docker logs <container-name>
kubectl logs <pod-name> -n mobility-platform

# Check database connection
psql -h <db-host> -U mobility_user -d user_service

# Check RabbitMQ
curl http://<rabbitmq-host>:15672/api/overview
```

#### 2. Database Connection Errors

```bash
# Verify database exists
psql -h localhost -U mobility_user -l

# Check network connectivity
telnet <db-host> 5432

# Verify credentials
psql -h <db-host> -U mobility_user -d user_service
```

#### 3. PostGIS Errors

```bash
# Verify PostGIS is installed
psql -d vehicle_service -c "SELECT PostGIS_Version();"

# Reinstall PostGIS if needed
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;
```

#### 4. Frontend API Connection Issues

```bash
# Check API Gateway
curl http://localhost:8080/api/users/health

# Verify CORS configuration
# Check browser console for CORS errors

# Check environment variable
echo $REACT_APP_API_URL
```

#### 5. Payment Gateway Integration

```bash
# Test create transaction
curl -X POST http://localhost:8080/api/payments/transaction/create \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"bookingId":1,"amount":100,"currency":"USD"}'

# Test verify transaction
curl -X POST "http://localhost:8080/api/payments/transaction/verify?transactionId=TXN-123"
```

---

## Production Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Secrets stored securely (Secrets Manager)
- [ ] SSL certificates obtained
- [ ] Domain DNS configured
- [ ] Firewall rules configured
- [ ] Database backups tested
- [ ] Load testing completed
- [ ] Security scan completed
- [ ] Payment gateway tested in staging

### Deployment
- [ ] Deploy infrastructure (DB, RabbitMQ, Redis)
- [ ] Deploy backend services
- [ ] Deploy frontend
- [ ] Configure load balancer
- [ ] Setup SSL/TLS
- [ ] Configure auto-scaling
- [ ] Setup monitoring (Prometheus + Grafana)
- [ ] Setup logging (ELK or CloudWatch)
- [ ] Configure alerts

### Post-Deployment
- [ ] Verify all services are healthy
- [ ] Test complete user flow
- [ ] Verify payment gateway integration
- [ ] Check database connections
- [ ] Verify PostGIS queries work
- [ ] Test booking creation
- [ ] Test driver assignment
- [ ] Monitor error rates
- [ ] Check resource utilization
- [ ] Setup backup schedule

---

## Cost Optimization

### AWS Cost Estimates (Monthly)

| Service | Type | Cost |
|---------|------|------|
| RDS PostgreSQL | db.t3.medium | ~$60 |
| Amazon MQ (RabbitMQ) | mq.t3.micro | ~$18 |
| ElastiCache (Redis) | cache.t3.micro | ~$15 |
| ECS Fargate (10 services, 2 tasks each) | 0.25 vCPU, 0.5GB | ~$300 |
| Application Load Balancer | - | ~$20 |
| CloudFront | 1TB transfer | ~$85 |
| S3 | 10GB | ~$0.23 |
| CloudWatch Logs | 10GB | ~$5 |
| **Total Estimated** | | **~$500/month** |

### Cost Optimization Tips

1. **Use Reserved Instances** for RDS (save 30-40%)
2. **Use Spot Instances** for non-critical services
3. **Enable auto-scaling** to scale down during low traffic
4. **Use S3 lifecycle policies** for old backups
5. **Enable compression** for CloudFront
6. **Use Redis for caching** to reduce database load

---

## Security Best Practices

### 1. Change All Default Passwords

```bash
# Generate strong passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32)
RABBITMQ_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

# Store in AWS Secrets Manager
aws secretsmanager create-secret \
  --name mobility/postgres-password \
  --secret-string "$POSTGRES_PASSWORD"
```

### 2. Enable Web Application Firewall (WAF)

```bash
aws wafv2 create-web-acl \
  --name mobility-waf \
  --scope REGIONAL \
  --default-action Allow={} \
  --rules file://waf-rules.json
```

### 3. Enable HTTPS Only

```nginx
# Nginx redirect HTTP to HTTPS
server {
    listen 80;
    server_name mobility.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mobility.yourdomain.com;
    
    ssl_certificate /etc/ssl/certs/mobility.crt;
    ssl_certificate_key /etc/ssl/private/mobility.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    # ...
}
```

### 4. Implement Rate Limiting

```yaml
# API Gateway rate limiting
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://user-service
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 10
                redis-rate-limiter.burstCapacity: 20
```

---

## Monitoring Alerts

### CloudWatch Alarms

```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name user-service-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Database connections alarm
aws cloudwatch put-metric-alarm \
  --alarm-name postgres-high-connections \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### Prometheus Alert Rules

Create `prometheus-alerts.yml`:

```yaml
groups:
  - name: mobility_alerts
    interval: 30s
    rules:
      - alert: ServiceDown
        expr: up{job="spring-boot"} == 0
        for: 5m
        annotations:
          summary: "Service {{ $labels.instance }} is down"
      
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 10m
        annotations:
          summary: "High error rate on {{ $labels.instance }}"
      
      - alert: HighMemoryUsage
        expr: jvm_memory_used_bytes / jvm_memory_max_bytes > 0.9
        for: 5m
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
```

---

## Quick Deployment Commands

### Deploy Everything (Docker Compose)

```bash
# 1. Create production environment file
cat > .env.production << EOF
POSTGRES_PASSWORD=$(openssl rand -base64 24)
RABBITMQ_PASSWORD=$(openssl rand -base64 24)
REDIS_PASSWORD=$(openssl rand -base64 24)
JWT_SECRET=$(openssl rand -base64 64)
EOF

# 2. Start all services
docker-compose -f docker-compose.production.yml --env-file .env.production up -d

# 3. Check status
docker-compose -f docker-compose.production.yml ps

# 4. View logs
docker-compose -f docker-compose.production.yml logs -f
```

### Deploy to Kubernetes

```bash
# 1. Create namespace and secrets
kubectl create namespace mobility-platform
kubectl create secret generic mobility-secrets \
  --from-literal=db-password=$(openssl rand -base64 24) \
  --from-literal=jwt-secret=$(openssl rand -base64 64) \
  -n mobility-platform

# 2. Deploy infrastructure
kubectl apply -f k8s/infrastructure/ -n mobility-platform

# 3. Deploy services
kubectl apply -f k8s/services/ -n mobility-platform

# 4. Deploy frontend and ingress
kubectl apply -f k8s/frontend/ -n mobility-platform
kubectl apply -f k8s/ingress.yaml -n mobility-platform

# 5. Check status
kubectl get pods -n mobility-platform
kubectl get services -n mobility-platform
kubectl get ingress -n mobility-platform
```

---

## Zero-Downtime Deployment

### Rolling Updates (Kubernetes)

```yaml
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

### Blue-Green Deployment

```bash
# Deploy new version (green)
kubectl apply -f k8s/user-service-v2-deployment.yaml

# Test green deployment
kubectl port-forward svc/user-service-green 9081:8081

# Switch traffic (update service selector)
kubectl patch service user-service -p '{"spec":{"selector":{"version":"v2"}}}'

# Remove old version (blue) after verification
kubectl delete deployment user-service-v1
```

---

## Payment Gateway Integration

### Connect Your Existing Payment Service

#### 1. Update Payment Client Configuration

In `application.yml` (each service that uses payments):

```yaml
payment:
  service:
    url: ${PAYMENT_SERVICE_URL:https://your-payment-gateway.com}
    api-key: ${PAYMENT_API_KEY}
    timeout: 30000
```

#### 2. Configure Feign Client

If your payment service is external (not in Eureka):

```java
@FeignClient(
    name = "payment-service",
    url = "${payment.service.url}",
    configuration = PaymentClientConfiguration.class
)
public interface PaymentClient {
    // Endpoints remain the same
}
```

#### 3. Add API Key Authentication

```java
@Configuration
public class PaymentClientConfiguration {
    @Value("${payment.service.api-key}")
    private String apiKey;
    
    @Bean
    public RequestInterceptor requestInterceptor() {
        return requestTemplate -> {
            requestTemplate.header("X-API-Key", apiKey);
            requestTemplate.header("Content-Type", "application/json");
        };
    }
}
```

#### 4. Test Integration

```bash
# Test create transaction
curl -X POST http://your-api-gateway/api/payments/transaction/create \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "bookingId": 1,
    "amount": 150.00,
    "currency": "USD",
    "description": "Test booking"
  }'

# Test verify transaction
curl -X POST "http://your-api-gateway/api/payments/transaction/verify?transactionId=TXN-123" \
  -H "Authorization: Bearer <jwt-token>"
```

---

## Success Criteria

### ✅ Deployment is Successful When:

1. All services show "healthy" status
2. Frontend is accessible via HTTPS
3. User can register and login
4. Vehicle search returns results (PostGIS working)
5. Booking can be created
6. Price calculation works
7. Payment transaction can be created
8. Payment transaction can be verified
9. Booking confirmed after payment
10. Reviews can be submitted
11. All health checks return 200
12. Metrics are visible in Grafana
13. Logs are visible in Kibana/CloudWatch
14. Auto-scaling triggers correctly
15. Backups are running

---

## Post-Deployment Monitoring

### Week 1: Intensive Monitoring

- Monitor error rates every hour
- Check response times
- Verify database performance
- Monitor payment success rate
- Check PostGIS query performance
- Review logs for errors
- Test all user flows daily

### Week 2-4: Regular Monitoring

- Daily health checks
- Weekly performance reviews
- Backup verification
- Security scans
- Cost analysis
- User feedback collection

### Ongoing: Automated Monitoring

- Prometheus alerts
- CloudWatch alarms
- Uptime monitoring (Pingdom, UptimeRobot)
- APM (Application Performance Monitoring)
- Error tracking (Sentry, Rollbar)

---

## Support Contacts

### Critical Issues
- Database Issues: DBA Team
- Payment Gateway: Payment Provider Support
- Infrastructure: DevOps Team
- Application Bugs: Development Team

### Escalation Path
1. On-call engineer (immediate)
2. Team lead (15 minutes)
3. CTO (30 minutes)

---

## Conclusion

This deployment guide provides comprehensive instructions for deploying the Mobility Rental Platform in various environments. Follow the checklist, monitor closely after deployment, and iterate based on real-world usage patterns.

**For Production Deployment**:
1. Start with Docker deployment for testing
2. Move to cloud (AWS/Azure) for scalability
3. Implement Kubernetes for orchestration
4. Add monitoring and logging
5. Setup CI/CD for automation
6. Implement disaster recovery
7. Optimize based on metrics

---

**Document Version**: 1.0  
**Last Updated**: December 11, 2025  
**Status**: Production Ready  
**Maintained By**: DevOps Team

