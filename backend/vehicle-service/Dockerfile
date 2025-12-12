# Build stage
FROM maven:3.9.5-eclipse-temurin-17 AS build
WORKDIR /app

# Copy parent pom
COPY pom.xml ./
COPY common-lib/pom.xml ./common-lib/
COPY vehicle-service/pom.xml ./vehicle-service/

# Download dependencies
RUN mvn dependency:go-offline -B

# Copy source code
COPY common-lib/src ./common-lib/src
COPY vehicle-service/src ./vehicle-service/src

# Build the application
RUN mvn clean package -pl vehicle-service -am -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/vehicle-service/target/*.jar app.jar

# Expose port
EXPOSE 8082

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8082/api/vehicles/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]





