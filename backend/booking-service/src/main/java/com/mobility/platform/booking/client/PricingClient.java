package com.mobility.platform.booking.client;

import com.mobility.platform.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

/**
 * Feign client for Pricing Service.
 */
@FeignClient(name = "pricing-service", path = "/api/pricing")
public interface PricingClient {

    @PostMapping("/delivery-fee")
    ApiResponse<Map<String, Object>> calculateDeliveryFee(@RequestBody Map<String, Object> request);
}
