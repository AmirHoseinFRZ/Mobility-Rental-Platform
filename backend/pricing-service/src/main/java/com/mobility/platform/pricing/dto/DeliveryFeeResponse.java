package com.mobility.platform.pricing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryFeeResponse {

    private String vehicleType;
    private Double distanceKm;
    private BigDecimal ratePerKm;
    private BigDecimal deliveryFee;
}
