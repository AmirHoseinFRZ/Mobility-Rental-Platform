package com.mobility.platform.booking.client;

import com.mobility.platform.common.dto.ApiResponse;
import com.mobility.platform.common.enums.VehicleStatus;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

/**
 * Feign client for Vehicle Service
 */
@FeignClient(name = "vehicle-service", path = "/api/vehicles")
public interface VehicleClient {
    
    @GetMapping("/{id}")
    ApiResponse<Object> getVehicleById(@PathVariable("id") Long id);
    
    @PatchMapping("/{id}/status")
    ApiResponse<Object> updateVehicleStatus(
            @PathVariable("id") Long id,
            @RequestParam("status") VehicleStatus status);
}






