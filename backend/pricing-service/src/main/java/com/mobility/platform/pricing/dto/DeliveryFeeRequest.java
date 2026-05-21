package com.mobility.platform.pricing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Delivery fee calculation request.
 */
@Data
public class DeliveryFeeRequest {

    @NotBlank(message = "Vehicle type is required")
    private String vehicleType;

    @NotNull(message = "Distance is required")
    @DecimalMin(value = "0.0", message = "Distance must be non-negative")
    private Double distanceKm;
}
