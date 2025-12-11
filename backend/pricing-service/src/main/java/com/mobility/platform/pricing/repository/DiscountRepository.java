package com.mobility.platform.pricing.repository;

import com.mobility.platform.pricing.entity.Discount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Discount repository
 */
@Repository
public interface DiscountRepository extends JpaRepository<Discount, Long> {
    
    Optional<Discount> findByCode(String code);
    
    List<Discount> findByActive(Boolean active);
    
    @Query("SELECT d FROM Discount d WHERE d.code = :code " +
            "AND d.active = true " +
            "AND d.validFrom <= :now " +
            "AND d.validTo >= :now " +
            "AND (d.maxUsageCount IS NULL OR d.currentUsageCount < d.maxUsageCount)")
    Optional<Discount> findValidDiscountByCode(
            @Param("code") String code,
            @Param("now") LocalDateTime now);
    
    @Query("SELECT d FROM Discount d WHERE d.active = true " +
            "AND d.validFrom <= :now " +
            "AND d.validTo >= :now")
    List<Discount> findAllActiveDiscounts(@Param("now") LocalDateTime now);
}

