package com.mobility.platform.pricing.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Price calculation request DTO
 */
@Data
public class PriceCalculationRequest {
    
    @NotBlank(message = "Vehicle type is required")
    private String vehicleType;
    
    @NotNull(message = "Start date/time is required")
    @Future(message = "Start date/time must be in the future")
    private LocalDateTime startDateTime;
    
    @NotNull(message = "End date/time is required")
    @Future(message = "End date/time must be in the future")
    private LocalDateTime endDateTime;
    
    @NotNull(message = "With driver flag is required")
    private Boolean withDriver;
    
    private String discountCode;
    
    private Long userId; // For user-specific discounts
    
    private String location; // For location-based pricing
}


