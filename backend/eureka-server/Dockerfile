# Build stage
FROM maven:3.9.5-eclipse-temurin-17 AS build
WORKDIR /app

# Copy parent pom
COPY pom.xml ./
COPY eureka-server/pom.xml ./eureka-server/

# Download dependencies
RUN mvn dependency:go-offline -B

# Copy source code
COPY eureka-server/src ./eureka-server/src

# Build the application
RUN mvn clean package -pl eureka-server -am -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Install wget for health checks
RUN apk add --no-cache wget

# Copy jar from build stage
COPY --from=build /app/eureka-server/target/*.jar app.jar

# Expose port
EXPOSE 8761

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8761/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]

