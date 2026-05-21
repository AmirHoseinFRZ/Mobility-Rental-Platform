package com.mobility.platform.pricing.entity;

import com.mobility.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Per-vehicle-type delivery fee rule (rate per km).
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "delivery_pricing_rules", indexes = {
        @Index(name = "idx_delivery_rule_vehicle_type", columnList = "vehicleType")
})
public class DeliveryPricingRule extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String vehicleType;

    @Column(nullable = false)
    private BigDecimal ratePerKm;

    @Column(nullable = false)
    private Boolean active = true;
}
