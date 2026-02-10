package com.mobility.platform.review.client.dto;

import lombok.Data;

/**
 * DTO for booking info when validating review eligibility.
 * Used to deserialize response from booking-service.
 */
@Data
public class BookingInfoDto {
    
    private Long id;
    private Long userId;
    private Long vehicleId;
    private Long driverId;
    private String status; // PENDING, CONFIRMED, ONGOING, COMPLETED, CANCELLED, REJECTED
}
