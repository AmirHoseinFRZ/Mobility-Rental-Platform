package com.mobility.platform.pricing.config;

import com.mobility.platform.pricing.entity.DeliveryPricingRule;
import com.mobility.platform.pricing.repository.DeliveryPricingRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Seeds default per-vehicle-type delivery rates on first startup.
 * Rates are in تومان per km.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DeliveryPricingSeeder implements CommandLineRunner {

    private final DeliveryPricingRuleRepository repository;

    private static final Map<String, BigDecimal> DEFAULTS = Map.of(
            "CAR", BigDecimal.valueOf(15000),
            "BIKE", BigDecimal.valueOf(8000),
            "SCOOTER", BigDecimal.valueOf(8000),
            "BICYCLE", BigDecimal.valueOf(5000),
            "VAN", BigDecimal.valueOf(20000),
            "TRUCK", BigDecimal.valueOf(25000)
    );

    @Override
    public void run(String... args) {
        for (Map.Entry<String, BigDecimal> entry : DEFAULTS.entrySet()) {
            if (repository.findByVehicleTypeAndActiveTrue(entry.getKey()).isEmpty()) {
                DeliveryPricingRule rule = new DeliveryPricingRule();
                rule.setVehicleType(entry.getKey());
                rule.setRatePerKm(entry.getValue());
                rule.setActive(true);
                repository.save(rule);
                log.info("Seeded delivery pricing rule: {} -> {} تومان/km",
                        entry.getKey(), entry.getValue());
            }
        }
    }
}
