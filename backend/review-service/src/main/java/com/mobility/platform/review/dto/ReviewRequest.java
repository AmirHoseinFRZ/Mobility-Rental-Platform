package com.mobility.platform.review.dto;

import com.mobility.platform.review.entity.Review;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ReviewRequest {
    
    @NotNull(message = "User ID is required")
    private Long userId;
    
    @NotNull(message = "Booking ID is required")
    private Long bookingId;
    
    private Long vehicleId;
    
    private Long driverId;
    
    @NotNull(message = "Review type is required")
    private Review.ReviewType reviewType;
    
    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;
    
    @Size(max = 2000, message = "Comment cannot exceed 2000 characters")
    private String comment;
}
