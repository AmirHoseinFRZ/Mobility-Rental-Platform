package com.mobility.platform.driver.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class DriverRequest {
    
    @NotNull(message = "User ID is required")
    private Long userId;
    
    @NotBlank(message = "License number is required")
    private String licenseNumber;
    
    @NotNull(message = "License expiry date is required")
    @Future(message = "License expiry date must be in the future")
    private LocalDate licenseExpiryDate;
    
    @NotBlank(message = "License type is required")
    private String licenseType;
    
    private String vehiclePreference;
    private String bio;
    private String profileImageUrl;
    private Double latitude;
    private Double longitude;
    private String currentAddress;
    private String currentCity;
}

