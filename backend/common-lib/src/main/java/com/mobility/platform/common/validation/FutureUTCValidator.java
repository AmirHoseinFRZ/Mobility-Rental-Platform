package com.mobility.platform.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Validator for @FutureUTC annotation that compares LocalDateTime values
 * using UTC timezone for the "now" reference point to avoid timezone-related validation issues.
 * 
 * This validator assumes the LocalDateTime value represents a UTC time and compares it
 * against the current UTC time. This ensures consistent validation regardless of the
 * server's system timezone.
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
        
        // Compare the LocalDateTime value with the current UTC time
        // This ensures validation is consistent regardless of server timezone
        LocalDateTime nowUTC = LocalDateTime.now(ZoneOffset.UTC);
        
        // The value is valid if it's after the current UTC time
        return value.isAfter(nowUTC);
    }
}

