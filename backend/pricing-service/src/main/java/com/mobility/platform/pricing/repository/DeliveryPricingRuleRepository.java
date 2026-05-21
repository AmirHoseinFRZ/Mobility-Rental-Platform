package com.mobility.platform.pricing.repository;

import com.mobility.platform.pricing.entity.DeliveryPricingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryPricingRuleRepository extends JpaRepository<DeliveryPricingRule, Long> {

    Optional<DeliveryPricingRule> findByVehicleTypeAndActiveTrue(String vehicleType);
}
