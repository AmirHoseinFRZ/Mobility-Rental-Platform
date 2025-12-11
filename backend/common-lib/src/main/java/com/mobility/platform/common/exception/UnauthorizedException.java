package com.mobility.platform.common.exception;

/**
 * Exception for authentication/authorization failures
 */
public class UnauthorizedException extends RuntimeException {
    
    public UnauthorizedException(String message) {
        super(message);
    }
}

