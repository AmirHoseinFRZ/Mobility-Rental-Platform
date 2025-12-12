package com.mobility.platform.pricing.entity;

import com.mobility.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Pricing rule entity for dynamic pricing
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "pricing_rules")
public class PricingRule extends BaseEntity {
    
    @Column(nullable = false)
    private String name;
    
    @Column(length = 1000)
    private String description;
    
    @Column(nullable = false)
    private String vehicleType; // CAR, BIKE, SCOOTER, etc.
    
    @Column(nullable = false)
    private BigDecimal baseHourlyRate;
    
    @Column(nullable = false)
    private BigDecimal baseDailyRate;
    
    @Column(nullable = false)
    private BigDecimal driverHourlyRate;
    
    @Column(nullable = false)
    private BigDecimal driverDailyRate;
    
    // Surge pricing multiplier (e.g., 1.5 for 50% increase)
    private BigDecimal surgeMultiplier = BigDecimal.ONE;
    
    // Weekend pricing multiplier
    private BigDecimal weekendMultiplier = BigDecimal.ONE;
    
    // Holiday pricing multiplier
    private BigDecimal holidayMultiplier = BigDecimal.ONE;
    
    // Peak hours multiplier
    private BigDecimal peakHoursMultiplier = BigDecimal.ONE;
    
    private String peakHoursStart; // e.g., "08:00"
    
    private String peakHoursEnd; // e.g., "10:00"
    
    // Minimum rental duration in hours
    private Integer minimumRentalHours = 1;
    
    // Discount for long-term rental (percentage)
    private BigDecimal longTermDiscountRate;
    
    // Long-term threshold in days
    private Integer longTermThresholdDays;
    
    @Column(nullable = false)
    private Boolean active = true;
    
    private LocalDateTime effectiveFrom;
    
    private LocalDateTime effectiveTo;
    
    private Integer priority = 0; // Higher priority rules override lower
}






