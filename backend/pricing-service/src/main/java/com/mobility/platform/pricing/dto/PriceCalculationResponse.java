package com.mobility.platform.pricing.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Price calculation response DTO
 */
@Data
@Builder
public class PriceCalculationResponse {
    
    private BigDecimal basePrice;
    private BigDecimal driverPrice;
    private BigDecimal surgeCharge;
    private BigDecimal weekendCharge;
    private BigDecimal peakHoursCharge;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal totalPrice;
    
    private String discountCode;
    private Boolean discountApplied;
    
    private Long rentalHours;
    private Long rentalDays;
    
    private String priceBreakdown; // Detailed breakdown text
}






