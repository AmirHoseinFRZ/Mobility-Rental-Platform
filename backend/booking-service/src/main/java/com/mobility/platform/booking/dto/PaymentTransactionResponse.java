package com.mobility.platform.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for payment transaction
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTransactionResponse {
    
    private String transactionId;
    
    private String invoiceId;
    
    private Long amount;
    
    private String status;
    
    private String gatewaySlug;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}

