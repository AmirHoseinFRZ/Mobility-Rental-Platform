package com.mobility.platform.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Validator for @FutureUTC annotation that compares LocalDateTime values
 * using Iran timezone (Asia/Tehran) for the "now" reference point.
 * 
 * This validator assumes the LocalDateTime value represents Iran time and compares it
 * against the current Iran time. This ensures consistent validation with Iran timezone.
 */
public class FutureUTCValidator implements ConstraintValidator<FutureUTC, LocalDateTime> {
    
    @Override
    public void initialize(FutureUTC constraintAnnotation) {
        // No initialization needed
    }
    
    @Override
    public boolean isValid(LocalDateTime value, ConstraintValidatorContext context) {
        if (value == null) {
            // Null values are handled by @NotNull annotation
            return true;
        }
        
        // Compare the LocalDateTime value with the current Iran time
        // This ensures validation is consistent with Iran timezone
        LocalDateTime nowIran = LocalDateTime.now(ZoneId.of("Asia/Tehran"));
        
        // The value is valid if it's after the current Iran time
        return value.isAfter(nowIran);
    }
}

