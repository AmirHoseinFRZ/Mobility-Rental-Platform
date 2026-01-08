package com.mobility.platform.pricing.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

import java.util.TimeZone;

/**
 * Configuration for setting application timezone to Asia/Tehran
 */
@Configuration
public class TimezoneConfig {
    
    @PostConstruct
    public void init() {
        // Set default timezone to Iran (Asia/Tehran)
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Tehran"));
    }
}

