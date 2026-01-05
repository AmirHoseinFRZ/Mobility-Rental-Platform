package com.mobility.platform.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Custom validation annotation that validates LocalDateTime is in the future
 * using UTC timezone for comparison, avoiding timezone-related validation issues.
 */
@Documented
@Constraint(validatedBy = FutureUTCValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface FutureUTC {
    
    String message() default "Date/time must be in the future";
    
    Class<?>[] groups() default {};
    
    Class<? extends Payload>[] payload() default {};
}

