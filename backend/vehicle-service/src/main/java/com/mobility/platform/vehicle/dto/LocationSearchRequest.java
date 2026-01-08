package com.mobility.platform.vehicle.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Location search request DTO
 */
@Data
public class LocationSearchRequest {
    
    @NotNull(message = "Latitude is required")
    private Double latitude;
    
    @NotNull(message = "Longitude is required")
    private Double longitude;
    
    private Double radiusKm = 5.0; // Default 5km radius
    
    private String vehicleType;
    
    private Boolean requiresDriver;
    
    // Optional time range for availability checking
    private LocalDateTime startDateTime;
    
    private LocalDateTime endDateTime;
}






