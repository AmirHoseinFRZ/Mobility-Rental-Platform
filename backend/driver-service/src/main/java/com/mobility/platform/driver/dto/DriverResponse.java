package com.mobility.platform.driver.dto;

import com.mobility.platform.driver.entity.Driver;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class DriverResponse {
    private Long id;
    private Long userId;
    private String licenseNumber;
    private LocalDate licenseExpiryDate;
    private String licenseType;
    private Driver.DriverStatus status;
    private Boolean available;
    private Boolean verified;
    private Double latitude;
    private Double longitude;
    private String currentAddress;
    private String currentCity;
    private Double rating;
    private Integer totalTrips;
    private Integer totalReviews;
    private BigDecimal totalEarnings;
    private String vehiclePreference;
    private String bio;
    private String profileImageUrl;
    private LocalDate joinDate;
    private LocalDate lastActiveDate;
    private Integer acceptanceRate;
    private Integer completionRate;
    private LocalDateTime createdAt;
    private Double distanceKm;
}






