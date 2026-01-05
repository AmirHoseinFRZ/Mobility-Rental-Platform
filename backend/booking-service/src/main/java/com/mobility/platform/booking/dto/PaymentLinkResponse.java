package com.mobility.platform.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for payment link
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentLinkResponse {
    
    private String paymentUrl;
    
    private String transactionId;
    
    private String gatewaySlug;
}

