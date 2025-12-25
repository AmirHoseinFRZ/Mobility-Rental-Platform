package com.mobility.platform.vehicle.dto;

import com.mobility.platform.common.enums.VehicleStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Vehicle response DTO
 */
@Data
public class VehicleResponse {
    
    private Long id;
    private Long ownerId;
    private String vehicleNumber;
    private String brand;
    private String model;
    private Integer year;
    private String vehicleType;
    private String color;
    private String licensePlate;
    private Integer seatingCapacity;
    private String fuelType;
    private String transmission;
    private BigDecimal pricePerHour;
    private BigDecimal pricePerDay;
    private VehicleStatus status;
    private Double latitude;
    private Double longitude;
    private String currentAddress;
    private String currentCity;
    private Integer totalKilometers;
    private String imageUrl;
    private String description;
    private String features;
    private Boolean available;
    private Boolean requiresDriver;
    private BigDecimal driverPricePerHour;
    private BigDecimal driverPricePerDay;
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;
    private LocalDate insuranceExpiryDate;
    private Double rating;
    private Integer totalReviews;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Double distanceKm; // Distance from search location
}






