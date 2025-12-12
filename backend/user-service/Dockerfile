# Build stage
FROM maven:3.9.5-eclipse-temurin-17 AS build
WORKDIR /app

# Copy parent pom
COPY pom.xml ./
COPY common-lib/pom.xml ./common-lib/
COPY user-service/pom.xml ./user-service/

# Download dependencies
RUN mvn dependency:go-offline -B

# Copy source code
COPY common-lib/src ./common-lib/src
COPY user-service/src ./user-service/src

# Build the application
RUN mvn clean package -pl user-service -am -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/user-service/target/*.jar app.jar

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8081/api/users/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]





