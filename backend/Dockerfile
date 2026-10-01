# ==============================================================================
# Stage 1: Build & Package (Hermetic Builder)
# ==============================================================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Cache Maven dependencies independently from source code
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy application source code and compile fat JAR (skipping live DB tests)
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==============================================================================
# Stage 2: Minimal Production Runtime
# ==============================================================================
FROM eclipse-temurin:21-jre-alpine AS runtime

# Establish non-root system group and user (UID/GID 10001)
RUN addgroup -g 10001 -S ledgergroup && \
    adduser -u 10001 -S ledgeruser -G ledgergroup -h /app

WORKDIR /app

# Copy executable fat JAR from builder stage with restricted ownership
COPY --from=builder --chown=ledgeruser:ledgergroup /build/target/event-sourced-ledger-1.0.0.jar app.jar

# Configuration defaults
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

# Run container as unprivileged non-root user
USER ledgeruser

# Runtime entrypoint
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
