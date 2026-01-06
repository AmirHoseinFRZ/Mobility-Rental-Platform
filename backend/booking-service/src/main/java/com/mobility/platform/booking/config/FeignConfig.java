package com.mobility.platform.booking.config;

import feign.Client;
import okhttp3.OkHttpClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Feign configuration to use OkHttp client which supports PATCH method.
 * This fixes the "Invalid HTTP method: PATCH" error when using Feign with HttpURLConnection.
 */
@Configuration
public class FeignConfig {
    
    @Bean
    public Client feignClient() {
        OkHttpClient okHttpClient = new OkHttpClient.Builder()
                .connectTimeout(5, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS)
                .writeTimeout(10, TimeUnit.SECONDS)
                .build();
        
        return new feign.okhttp.OkHttpClient(okHttpClient);
    }
}

