package com.mobility.platform.user.dto;

import com.mobility.platform.common.enums.UserRole;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * User response DTO
 */
@Data
public class UserResponse {
    
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String address;
    private String city;
    private String country;
    private String zipCode;
    private UserRole role;
    private Boolean active;
    private Boolean emailVerified;
    private Boolean phoneVerified;
    private String profileImageUrl;
    private String driverLicenseNumber;
    private LocalDate driverLicenseExpiry;
    private Boolean kycVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}





