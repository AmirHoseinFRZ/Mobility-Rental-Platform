# Build stage
FROM maven:3.9.5-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml ./
COPY common-lib/pom.xml ./common-lib/
COPY location-service/pom.xml ./location-service/

RUN mvn dependency:go-offline -B

COPY common-lib/src ./common-lib/src
COPY location-service/src ./location-service/src

RUN mvn clean package -pl location-service -am -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /app/location-service/target/*.jar app.jar

EXPOSE 8087

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8087/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]





