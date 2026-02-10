package com.mobility.platform.review.client.dto;

import lombok.Data;

/**
 * Minimal DTO for vehicle rating update response from vehicle-service.
 */
@Data
public class VehicleRatingUpdateResponse {
    private Long id;
    private Double rating;
    private Integer totalReviews;
}
