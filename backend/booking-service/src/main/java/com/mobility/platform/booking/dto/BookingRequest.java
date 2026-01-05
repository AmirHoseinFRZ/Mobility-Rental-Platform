package com.mobility.platform.booking.dto;

import com.mobility.platform.common.validation.FutureUTC;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Booking request DTO
 */
@Data
public class BookingRequest {
    
    @NotNull(message = "User ID is required")
    private Long userId;
    
    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;
    
    private Long driverId; // Optional, for with-driver bookings
    
    @NotNull(message = "Start date/time is required")
    @FutureUTC(message = "Start date/time must be in the future")
    private LocalDateTime startDateTime;
    
    @NotNull(message = "End date/time is required")
    @FutureUTC(message = "End date/time must be in the future")
    private LocalDateTime endDateTime;
    
    @NotBlank(message = "Pickup location is required")
    private String pickupLocation;
    
    private Double pickupLatitude;
    
    private Double pickupLongitude;
    
    private String dropoffLocation;
    
    private Double dropoffLatitude;
    
    private Double dropoffLongitude;
    
    @NotNull(message = "With driver flag is required")
    private Boolean withDriver;
    
    private String specialRequests;
    
    // Price fields (optional - if provided, will be used; otherwise backend will calculate)
    private BigDecimal vehiclePrice;
    private BigDecimal driverPrice;
    private BigDecimal totalPrice;
}






