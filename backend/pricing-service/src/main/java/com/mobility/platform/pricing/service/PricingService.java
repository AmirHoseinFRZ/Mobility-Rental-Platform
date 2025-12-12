package com.mobility.platform.pricing.service;

import com.mobility.platform.common.exception.BusinessException;
import com.mobility.platform.common.exception.ResourceNotFoundException;
import com.mobility.platform.pricing.dto.PriceCalculationRequest;
import com.mobility.platform.pricing.dto.PriceCalculationResponse;
import com.mobility.platform.pricing.entity.Discount;
import com.mobility.platform.pricing.entity.PricingRule;
import com.mobility.platform.pricing.repository.DiscountRepository;
import com.mobility.platform.pricing.repository.PricingRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Pricing service implementation with dynamic pricing logic
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PricingService {
    
    private final PricingRuleRepository pricingRuleRepository;
    private final DiscountRepository discountRepository;
    
    public PriceCalculationResponse calculatePrice(PriceCalculationRequest request) {
        log.info("Calculating price for vehicle type: {}, withDriver: {}", 
                request.getVehicleType(), request.getWithDriver());
        
        // Validate dates
        if (request.getEndDateTime().isBefore(request.getStartDateTime())) {
            throw new BusinessException("End date/time must be after start date/time", "INVALID_DATE_RANGE");
        }
        
        // Get pricing rule
        PricingRule rule = pricingRuleRepository.findActiveRuleForVehicleType(
                request.getVehicleType(), LocalDateTime.now())
                .orElseThrow(() -> new BusinessException(
                        "No pricing rule found for vehicle type: " + request.getVehicleType(),
                        "NO_PRICING_RULE"));
        
        // Calculate duration
        Duration duration = Duration.between(request.getStartDateTime(), request.getEndDateTime());
        long totalHours = duration.toHours();
        long totalDays = duration.toDays();
        
        // Enforce minimum rental duration
        if (totalHours < rule.getMinimumRentalHours()) {
            totalHours = rule.getMinimumRentalHours();
        }
        
        // Calculate base price
        BigDecimal basePrice = calculateBasePrice(rule, totalHours, totalDays);
        
        // Calculate driver price
        BigDecimal driverPrice = BigDecimal.ZERO;
        if (request.getWithDriver()) {
            driverPrice = calculateDriverPrice(rule, totalHours, totalDays);
        }
        
        // Calculate surge pricing
        BigDecimal surgeCharge = calculateSurgeCharge(basePrice, rule);
        
        // Calculate weekend pricing
        BigDecimal weekendCharge = calculateWeekendCharge(
                basePrice, rule, request.getStartDateTime(), request.getEndDateTime());
        
        // Calculate peak hours pricing
        BigDecimal peakHoursCharge = calculatePeakHoursCharge(
                basePrice, rule, request.getStartDateTime(), request.getEndDateTime());
        
        // Calculate subtotal
        BigDecimal subtotal = basePrice
                .add(driverPrice)
                .add(surgeCharge)
                .add(weekendCharge)
                .add(peakHoursCharge);
        
        // Apply long-term discount
        if (rule.getLongTermDiscountRate() != null && 
            rule.getLongTermThresholdDays() != null &&
            totalDays >= rule.getLongTermThresholdDays()) {
            BigDecimal longTermDiscount = subtotal.multiply(rule.getLongTermDiscountRate())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            subtotal = subtotal.subtract(longTermDiscount);
        }
        
        // Apply discount code
        BigDecimal discountAmount = BigDecimal.ZERO;
        Boolean discountApplied = false;
        String discountCode = null;
        
        if (request.getDiscountCode() != null && !request.getDiscountCode().isEmpty()) {
            Discount discount = discountRepository.findValidDiscountByCode(
                    request.getDiscountCode(), LocalDateTime.now())
                    .orElse(null);
            
            if (discount != null && isDiscountApplicable(discount, request, subtotal)) {
                discountAmount = calculateDiscountAmount(discount, subtotal);
                discountApplied = true;
                discountCode = discount.getCode();
            }
        }
        
        // Calculate total
        BigDecimal totalPrice = subtotal.subtract(discountAmount);
        if (totalPrice.compareTo(BigDecimal.ZERO) < 0) {
            totalPrice = BigDecimal.ZERO;
        }
        
        // Build price breakdown
        String priceBreakdown = buildPriceBreakdown(
                basePrice, driverPrice, surgeCharge, weekendCharge, 
                peakHoursCharge, discountAmount, totalHours, totalDays);
        
        log.info("Price calculated: Total = {}, Discount = {}", totalPrice, discountAmount);
        
        return PriceCalculationResponse.builder()
                .basePrice(basePrice.setScale(2, RoundingMode.HALF_UP))
                .driverPrice(driverPrice.setScale(2, RoundingMode.HALF_UP))
                .surgeCharge(surgeCharge.setScale(2, RoundingMode.HALF_UP))
                .weekendCharge(weekendCharge.setScale(2, RoundingMode.HALF_UP))
                .peakHoursCharge(peakHoursCharge.setScale(2, RoundingMode.HALF_UP))
                .subtotal(subtotal.setScale(2, RoundingMode.HALF_UP))
                .discountAmount(discountAmount.setScale(2, RoundingMode.HALF_UP))
                .totalPrice(totalPrice.setScale(2, RoundingMode.HALF_UP))
                .discountCode(discountCode)
                .discountApplied(discountApplied)
                .rentalHours(totalHours)
                .rentalDays(totalDays)
                .priceBreakdown(priceBreakdown)
                .build();
    }
    
    private BigDecimal calculateBasePrice(PricingRule rule, long hours, long days) {
        // If rental is for full days, use daily rate
        if (hours >= 24 && days > 0) {
            return rule.getBaseDailyRate().multiply(BigDecimal.valueOf(days));
        }
        // Otherwise use hourly rate
        return rule.getBaseHourlyRate().multiply(BigDecimal.valueOf(hours));
    }
    
    private BigDecimal calculateDriverPrice(PricingRule rule, long hours, long days) {
        if (hours >= 24 && days > 0) {
            return rule.getDriverDailyRate().multiply(BigDecimal.valueOf(days));
        }
        return rule.getDriverHourlyRate().multiply(BigDecimal.valueOf(hours));
    }
    
    private BigDecimal calculateSurgeCharge(BigDecimal basePrice, PricingRule rule) {
        if (rule.getSurgeMultiplier().compareTo(BigDecimal.ONE) > 0) {
            return basePrice.multiply(rule.getSurgeMultiplier().subtract(BigDecimal.ONE));
        }
        return BigDecimal.ZERO;
    }
    
    private BigDecimal calculateWeekendCharge(BigDecimal basePrice, PricingRule rule, 
                                               LocalDateTime start, LocalDateTime end) {
        if (rule.getWeekendMultiplier().compareTo(BigDecimal.ONE) > 0) {
            // Check if rental period includes weekend
            DayOfWeek startDay = start.getDayOfWeek();
            DayOfWeek endDay = end.getDayOfWeek();
            
            if (startDay == DayOfWeek.SATURDAY || startDay == DayOfWeek.SUNDAY ||
                endDay == DayOfWeek.SATURDAY || endDay == DayOfWeek.SUNDAY) {
                return basePrice.multiply(rule.getWeekendMultiplier().subtract(BigDecimal.ONE));
            }
        }
        return BigDecimal.ZERO;
    }
    
    private BigDecimal calculatePeakHoursCharge(BigDecimal basePrice, PricingRule rule,
                                                 LocalDateTime start, LocalDateTime end) {
        if (rule.getPeakHoursMultiplier().compareTo(BigDecimal.ONE) > 0 &&
            rule.getPeakHoursStart() != null && rule.getPeakHoursEnd() != null) {
            
            LocalTime peakStart = LocalTime.parse(rule.getPeakHoursStart());
            LocalTime peakEnd = LocalTime.parse(rule.getPeakHoursEnd());
            LocalTime startTime = start.toLocalTime();
            
            if (startTime.isAfter(peakStart) && startTime.isBefore(peakEnd)) {
                return basePrice.multiply(rule.getPeakHoursMultiplier().subtract(BigDecimal.ONE));
            }
        }
        return BigDecimal.ZERO;
    }
    
    private boolean isDiscountApplicable(Discount discount, PriceCalculationRequest request, 
                                         BigDecimal subtotal) {
        // Check minimum booking amount
        if (discount.getMinimumBookingAmount() != null &&
            subtotal.compareTo(discount.getMinimumBookingAmount()) < 0) {
            return false;
        }
        
        // Check if applicable to with-driver bookings
        if (request.getWithDriver() && !discount.getApplicableToWithDriver()) {
            return false;
        }
        
        // Check vehicle type compatibility
        if (discount.getApplicableVehicleTypes() != null) {
            String[] types = discount.getApplicableVehicleTypes().split(",");
            boolean found = false;
            for (String type : types) {
                if (type.trim().equalsIgnoreCase(request.getVehicleType())) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }
        
        return true;
    }
    
    private BigDecimal calculateDiscountAmount(Discount discount, BigDecimal subtotal) {
        BigDecimal discountAmount;
        
        if (discount.getType() == Discount.DiscountType.PERCENTAGE) {
            discountAmount = subtotal.multiply(discount.getValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            discountAmount = discount.getValue();
        }
        
        // Apply maximum discount cap
        if (discount.getMaxDiscountAmount() != null &&
            discountAmount.compareTo(discount.getMaxDiscountAmount()) > 0) {
            discountAmount = discount.getMaxDiscountAmount();
        }
        
        // Ensure discount doesn't exceed subtotal
        if (discountAmount.compareTo(subtotal) > 0) {
            discountAmount = subtotal;
        }
        
        return discountAmount;
    }
    
    @Transactional
    public void applyDiscount(String discountCode) {
        Discount discount = discountRepository.findByCode(discountCode)
                .orElseThrow(() -> new ResourceNotFoundException("Discount", "code", discountCode));
        
        discount.setCurrentUsageCount(discount.getCurrentUsageCount() + 1);
        discountRepository.save(discount);
        
        log.info("Discount {} applied. Current usage: {}", discountCode, discount.getCurrentUsageCount());
    }
    
    private String buildPriceBreakdown(BigDecimal basePrice, BigDecimal driverPrice,
                                       BigDecimal surgeCharge, BigDecimal weekendCharge,
                                       BigDecimal peakHoursCharge, BigDecimal discountAmount,
                                       long hours, long days) {
        StringBuilder breakdown = new StringBuilder();
        breakdown.append(String.format("Base Price (%d hours, %d days): $%.2f\n", 
                hours, days, basePrice));
        
        if (driverPrice.compareTo(BigDecimal.ZERO) > 0) {
            breakdown.append(String.format("Driver Fee: $%.2f\n", driverPrice));
        }
        if (surgeCharge.compareTo(BigDecimal.ZERO) > 0) {
            breakdown.append(String.format("Surge Charge: $%.2f\n", surgeCharge));
        }
        if (weekendCharge.compareTo(BigDecimal.ZERO) > 0) {
            breakdown.append(String.format("Weekend Charge: $%.2f\n", weekendCharge));
        }
        if (peakHoursCharge.compareTo(BigDecimal.ZERO) > 0) {
            breakdown.append(String.format("Peak Hours Charge: $%.2f\n", peakHoursCharge));
        }
        if (discountAmount.compareTo(BigDecimal.ZERO) > 0) {
            breakdown.append(String.format("Discount: -$%.2f\n", discountAmount));
        }
        
        return breakdown.toString();
    }
}





