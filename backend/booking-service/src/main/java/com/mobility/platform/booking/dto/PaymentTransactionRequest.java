package com.mobility.platform.booking.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a payment transaction
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTransactionRequest {
    
    @NotBlank(message = "Invoice ID is required")
    private String invoiceId;
    
    @Min(value = 1000, message = "Amount must be at least 1000 (minimum 10 currency units)")
    private Long amount; // Amount in smallest currency unit (e.g., cents/rials)
    
    private String mobileNumber;
    
    private String email;
    
    @NotBlank(message = "Callback URL is required")
    private String callbackUrl;
    
    private String description;
}

