package com.mobility.platform.pricing.controller;

import com.mobility.platform.common.dto.ApiResponse;
import com.mobility.platform.pricing.dto.PriceCalculationRequest;
import com.mobility.platform.pricing.dto.PriceCalculationResponse;
import com.mobility.platform.pricing.service.PricingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Pricing REST controller
 */
@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "Pricing Management", description = "Dynamic pricing and discount management")
public class PricingController {
    
    private final PricingService pricingService;
    
    @PostMapping("/calculate")
    @Operation(summary = "Calculate price for booking")
    public ResponseEntity<ApiResponse<PriceCalculationResponse>> calculatePrice(
            @Valid @RequestBody PriceCalculationRequest request) {
        PriceCalculationResponse response = pricingService.calculatePrice(request);
        return ResponseEntity.ok(ApiResponse.success("Price calculated successfully", response));
    }
    
    @PostMapping("/apply-discount/{discountCode}")
    @Operation(summary = "Apply discount code (increment usage count)")
    public ResponseEntity<ApiResponse<Void>> applyDiscount(@PathVariable String discountCode) {
        pricingService.applyDiscount(discountCode);
        return ResponseEntity.ok(ApiResponse.success("Discount applied successfully", null));
    }
    
    @GetMapping("/health")
    @Operation(summary = "Health check")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("Pricing service is running", "OK"));
    }
}


