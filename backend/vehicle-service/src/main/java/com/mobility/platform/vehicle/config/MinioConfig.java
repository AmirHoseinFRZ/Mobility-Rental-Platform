package com.mobility.platform.vehicle.config;

import io.minio.MinioClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * MinIO client configuration for vehicle image storage.
 * Credentials must match MinIO server (MINIO_ROOT_USER / MINIO_ROOT_PASSWORD).
 */
@Slf4j
@Configuration
public class MinioConfig {

    private static final String DEFAULT_ACCESS_KEY = "admin";
    private static final String DEFAULT_SECRET_KEY = "admin123";

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.access-key:}")
    private String accessKey;

    @Value("${minio.secret-key:}")
    private String secretKey;

    @Bean
    public MinioClient minioClient() {
        String rawAccess = accessKey != null ? accessKey.strip() : "";
        String rawSecret = secretKey != null ? secretKey.strip() : "";
        String resolvedAccessKey = !rawAccess.isBlank() ? rawAccess : DEFAULT_ACCESS_KEY;
        String resolvedSecretKey = !rawSecret.isBlank() ? rawSecret : DEFAULT_SECRET_KEY;
        if (resolvedAccessKey.equals(DEFAULT_ACCESS_KEY) && rawAccess.isBlank()) {
            log.info("MinIO using default credentials (admin). Set MINIO_ROOT_USER and MINIO_ROOT_PASSWORD to match your MinIO server if needed.");
        } else {
            log.info("MinIO configured: endpoint={}, accessKey={}", endpoint, resolvedAccessKey);
        }
        // Endpoint must not have trailing slash for correct request signing
        String normalizedEndpoint = (endpoint != null ? endpoint.strip() : "").replaceAll("/+$", "");
        return MinioClient.builder()
                .endpoint(normalizedEndpoint)
                .credentials(resolvedAccessKey, resolvedSecretKey)
                .build();
    }
}
