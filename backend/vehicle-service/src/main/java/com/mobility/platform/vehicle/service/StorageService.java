package com.mobility.platform.vehicle.service;

import com.mobility.platform.common.exception.BusinessException;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.SetBucketPolicyArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;

/**
 * Service for storing vehicle images in MinIO.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StorageService {

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucket;

    @Value("${minio.public-url}")
    private String publicUrl;

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final String[] ALLOWED_CONTENT_TYPES = {
            "image/jpeg", "image/png", "image/gif", "image/webp"
    };

    /**
     * Upload a vehicle image to MinIO and return the public URL.
     */
    public String uploadVehicleImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("No file provided", "NO_FILE");
        }

        String contentType = file.getContentType();
        if (contentType == null || !isAllowedContentType(contentType)) {
            throw new BusinessException(
                    "Invalid file type. Allowed: JPEG, PNG, GIF, WebP",
                    "INVALID_FILE_TYPE"
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException("File size must not exceed 5 MB", "FILE_TOO_LARGE");
        }

        ensureBucketExists();

        String objectName = "vehicles/" + UUID.randomUUID() + "-" + sanitizeFilename(file.getOriginalFilename());

        try (InputStream inputStream = file.getInputStream()) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .stream(inputStream, file.getSize(), -1)
                            .contentType(contentType)
                            .build()
            );
        } catch (Exception e) {
            log.error("Failed to upload image to MinIO: {}", e.getMessage());
            throw new BusinessException("Failed to upload image: " + e.getMessage(), "UPLOAD_FAILED");
        }

        String url = publicUrl + "/" + bucket + "/" + objectName;
        log.info("Uploaded vehicle image: {}", objectName);
        return url;
    }

    private void ensureBucketExists() {
        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(bucket).build()
            );
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                setBucketPublicRead(bucket);
                log.info("Created MinIO bucket: {}", bucket);
            }
        } catch (Exception e) {
            log.warn("Could not ensure bucket exists (may already exist): {}", e.getMessage());
        }
    }

    private void setBucketPublicRead(String bucketName) {
        try {
            String policy = "{\n"
                    + "  \"Version\": \"2012-10-17\",\n"
                    + "  \"Statement\": [\n"
                    + "    {\n"
                    + "      \"Effect\": \"Allow\",\n"
                    + "      \"Principal\": \"*\",\n"
                    + "      \"Action\": [\"s3:GetObject\"],\n"
                    + "      \"Resource\": [\"arn:aws:s3:::" + bucketName + "/*\"]\n"
                    + "    }\n"
                    + "  ]\n"
                    + "}";
            minioClient.setBucketPolicy(
                    SetBucketPolicyArgs.builder()
                            .bucket(bucketName)
                            .config(policy)
                            .build()
            );
        } catch (Exception e) {
            log.warn("Could not set bucket policy (images may require auth): {}", e.getMessage());
        }
    }

    private boolean isAllowedContentType(String contentType) {
        for (String allowed : ALLOWED_CONTENT_TYPES) {
            if (allowed.equalsIgnoreCase(contentType)) {
                return true;
            }
        }
        return false;
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "image";
        }
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
