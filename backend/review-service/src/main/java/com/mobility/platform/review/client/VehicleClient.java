package com.mobility.platform.review.client;

import com.mobility.platform.common.dto.ApiResponse;
import com.mobility.platform.review.client.dto.VehicleRatingUpdateResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * Feign client for Vehicle Service - used to update vehicle rating
 * and total reviews count after a new review is submitted.
 */
@FeignClient(name = "vehicle-service", path = "/api/vehicles")
public interface VehicleClient {
    
    @PatchMapping("/{id}/rating")
    ApiResponse<VehicleRatingUpdateResponse> updateVehicleRating(
            @PathVariable("id") Long vehicleId,
            @RequestParam("rating") Double rating,
            @RequestParam("totalReviews") Integer totalReviews);
}
