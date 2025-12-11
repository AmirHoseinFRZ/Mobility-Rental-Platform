package com.mobility.platform.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Login request DTO
 */
@Data
public class LoginRequest {
    
    @NotBlank(message = "Email or phone number is required")
    private String emailOrPhone;
    
    @NotBlank(message = "Password is required")
    private String password;
}

