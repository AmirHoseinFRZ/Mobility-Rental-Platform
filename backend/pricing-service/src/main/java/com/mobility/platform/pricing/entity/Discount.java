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
 * Discount/Promotion entity
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "discounts", indexes = {
        @Index(name = "idx_code", columnList = "code"),
        @Index(name = "idx_active", columnList = "active")
})
public class Discount extends BaseEntity {
    
    @Column(unique = true, nullable = false)
    private String code; // PROMO code
    
    @Column(nullable = false)
    private String name;
    
    @Column(length = 1000)
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DiscountType type; // PERCENTAGE, FIXED_AMOUNT
    
    @Column(nullable = false)
    private BigDecimal value; // Percentage (e.g., 10 for 10%) or fixed amount
    
    private BigDecimal maxDiscountAmount; // Maximum discount cap
    
    private BigDecimal minimumBookingAmount; // Minimum booking amount to apply
    
    @Column(nullable = false)
    private LocalDateTime validFrom;
    
    @Column(nullable = false)
    private LocalDateTime validTo;
    
    private Integer maxUsageCount; // Total usage limit
    
    private Integer currentUsageCount = 0;
    
    private Integer maxUsagePerUser; // Per user usage limit
    
    @Column(nullable = false)
    private Boolean active = true;
    
    private Boolean firstTimeUserOnly = false;
    
    private Boolean applicableToWithDriver = true;
    
    private String applicableVehicleTypes; // Comma-separated list
    
    public enum DiscountType {
        PERCENTAGE,
        FIXED_AMOUNT
    }
}

