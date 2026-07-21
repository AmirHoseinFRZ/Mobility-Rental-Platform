package com.mobility.platform.review.config;

import feign.Client;
import feign.Retryer;
import okhttp3.OkHttpClient;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Feign configuration to use OkHttp client which supports the PATCH method.
 * This fixes the "Invalid HTTP method: PATCH" error thrown by the default
 * HttpURLConnection-based Feign client when calling
 * PATCH /api/vehicles/{id}/rating to update a vehicle's aggregate rating.
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
        // Retry up to 2 times for transient failures: period=100ms, maxPeriod=1000ms, maxAttempts=2
        return new Retryer.Default(100, 1000, 2);
    }
}
