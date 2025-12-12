package com.mobility.platform.review.controller;

import com.mobility.platform.common.dto.ApiResponse;
import com.mobility.platform.review.dto.ReviewRequest;
import com.mobility.platform.review.dto.ReviewResponse;
import com.mobility.platform.review.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "Review Management", description = "Customer reviews and ratings")
public class ReviewController {
    
    private final ReviewService reviewService;
    
    @PostMapping
    @Operation(summary = "Create review")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(@Valid @RequestBody ReviewRequest request) {
        ReviewResponse response = reviewService.createReview(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Review created successfully", response));
    }
    
    @GetMapping("/vehicle/{vehicleId}")
    @Operation(summary = "Get reviews for vehicle")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getVehicleReviews(@PathVariable Long vehicleId) {
        List<ReviewResponse> reviews = reviewService.getVehicleReviews(vehicleId);
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }
    
    @GetMapping("/driver/{driverId}")
    @Operation(summary = "Get reviews for driver")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getDriverReviews(@PathVariable Long driverId) {
        List<ReviewResponse> reviews = reviewService.getDriverReviews(driverId);
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }
    
    @GetMapping("/vehicle/{vehicleId}/rating")
    @Operation(summary = "Get average rating for vehicle")
    public ResponseEntity<ApiResponse<Double>> getVehicleRating(@PathVariable Long vehicleId) {
        Double rating = reviewService.getAverageRatingForVehicle(vehicleId);
        return ResponseEntity.ok(ApiResponse.success(rating));
    }
    
    @GetMapping("/driver/{driverId}/rating")
    @Operation(summary = "Get average rating for driver")
    public ResponseEntity<ApiResponse<Double>> getDriverRating(@PathVariable Long driverId) {
        Double rating = reviewService.getAverageRatingForDriver(driverId);
        return ResponseEntity.ok(ApiResponse.success(rating));
    }
    
    @GetMapping("/health")
    @Operation(summary = "Health check")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("Review service is running", "OK"));
    }
}





