package com.mobility.platform.vehicle.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Vehicle request DTO
 */
@Data
public class VehicleRequest {
    
    @NotBlank(message = "Vehicle number is required")
    private String vehicleNumber;
    
    @NotBlank(message = "Brand is required")
    private String brand;
    
    @NotBlank(message = "Model is required")
    private String model;
    
    @NotNull(message = "Year is required")
    @Min(value = 1900, message = "Year must be after 1900")
    @Max(value = 2100, message = "Year must be before 2100")
    private Integer year;
    
    @NotBlank(message = "Vehicle type is required")
    private String vehicleType;
    
    private String color;
    
    private String licensePlate;
    
    @NotNull(message = "Seating capacity is required")
    @Min(value = 1, message = "Seating capacity must be at least 1")
    private Integer seatingCapacity;
    
    private String fuelType;
    
    private String transmission;
    
    @NotNull(message = "Price per hour is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal pricePerHour;
    
    @NotNull(message = "Price per day is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal pricePerDay;
    
    private Double latitude;
    
    private Double longitude;
    
    private String currentAddress;
    
    private String currentCity;
    
    private String imageUrl;
    
    private String description;
    
    private String features;
    
    private Boolean requiresDriver;
    
    private BigDecimal driverPricePerHour;
    
    private BigDecimal driverPricePerDay;
}





