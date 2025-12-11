package com.mobility.platform.review.dto;

import com.mobility.platform.review.entity.Review;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReviewResponse {
    private Long id;
    private Long userId;
    private Long bookingId;
    private Long vehicleId;
    private Long driverId;
    private Review.ReviewType reviewType;
    private Integer rating;
    private String comment;
    private String response;
    private Boolean verified;
    private Boolean approved;
    private Integer helpfulCount;
    private LocalDateTime createdAt;
}
