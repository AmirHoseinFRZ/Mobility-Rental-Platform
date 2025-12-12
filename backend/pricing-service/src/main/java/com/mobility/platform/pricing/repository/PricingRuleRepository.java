package com.mobility.platform.pricing.repository;

import com.mobility.platform.pricing.entity.PricingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Pricing rule repository
 */
@Repository
public interface PricingRuleRepository extends JpaRepository<PricingRule, Long> {
    
    List<PricingRule> findByActive(Boolean active);
    
    List<PricingRule> findByVehicleType(String vehicleType);
    
    @Query("SELECT p FROM PricingRule p WHERE p.vehicleType = :vehicleType " +
            "AND p.active = true " +
            "AND (p.effectiveFrom IS NULL OR p.effectiveFrom <= :now) " +
            "AND (p.effectiveTo IS NULL OR p.effectiveTo >= :now) " +
            "ORDER BY p.priority DESC")
    Optional<PricingRule> findActiveRuleForVehicleType(
            @Param("vehicleType") String vehicleType,
            @Param("now") LocalDateTime now);
    
    @Query("SELECT p FROM PricingRule p WHERE p.active = true " +
            "ORDER BY p.priority DESC")
    List<PricingRule> findAllActiveRules();
}


