package com.mobility.platform.booking.config;

import feign.Client;
import feign.Retryer;
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
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(15, TimeUnit.SECONDS)
                .writeTimeout(15, TimeUnit.SECONDS)
                .retryOnConnectionFailure(true)
                .build();
        
        return new feign.okhttp.OkHttpClient(okHttpClient);
    }
    
    @Bean
    public Retryer feignRetryer() {
        // Retry up to 3 times with 1 second intervals
        return new Retryer.Default(1000, 2000, 3);
    }
}

