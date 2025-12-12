# Build stage
FROM maven:3.9.5-eclipse-temurin-17 AS build
WORKDIR /app

# Copy parent pom
COPY pom.xml ./
COPY common-lib/pom.xml ./common-lib/
COPY pricing-service/pom.xml ./pricing-service/

# Download dependencies
RUN mvn dependency:go-offline -B

# Copy source code
COPY common-lib/src ./common-lib/src
COPY pricing-service/src ./pricing-service/src

# Build the application
RUN mvn clean package -pl pricing-service -am -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/pricing-service/target/*.jar app.jar

# Expose port
EXPOSE 8084

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8084/api/pricing/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]






