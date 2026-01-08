package com.mobility.platform.booking.config;

import feign.Client;
import feign.Logger;
import feign.Retryer;
import feign.codec.ErrorDecoder;
import okhttp3.OkHttpClient;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Feign configuration to use OkHttp client which supports PATCH method.
 * This fixes the "Invalid HTTP method: PATCH" error when using Feign with HttpURLConnection.
 * Also configures retries for transient failures.
 */
@Configuration
public class FeignConfig {
    
    @Bean
    @LoadBalanced
    public Client feignClient() {
        OkHttpClient okHttpClient = new OkHttpClient.Builder()
                .connectTimeout(3, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS)
                .writeTimeout(10, TimeUnit.SECONDS)
                .retryOnConnectionFailure(false) // Disable OkHttp retry, use Feign retry instead
                .build();
        
        return new feign.okhttp.OkHttpClient(okHttpClient);
    }
    
    @Bean
    public Retryer feignRetryer() {
        // Retry up to 2 times with shorter intervals
        // period = 100ms, maxPeriod = 1000ms, maxAttempts = 2
        // This will retry quickly for transient failures but won't wait too long
        return new Retryer.Default(100, 1000, 2);
    }
    
    @Bean
    public Logger.Level feignLoggerLevel() {
        // Enable detailed logging for debugging
        return Logger.Level.BASIC;
    }
    
    @Bean
    public ErrorDecoder errorDecoder() {
        return new FeignErrorDecoder();
    }
}

