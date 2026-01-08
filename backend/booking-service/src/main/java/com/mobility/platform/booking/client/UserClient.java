package com.mobility.platform.booking.client;

import com.mobility.platform.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Feign client for User Service
 */
@FeignClient(name = "user-service", path = "/api/users")
public interface UserClient {
    
    @GetMapping("/{id}")
    ApiResponse<Object> getUserById(@PathVariable("id") Long id);
}

