package com.mobility.platform.booking.dto;

import com.mobility.platform.common.enums.BookingStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Booking response DTO
 */
@Data
public class BookingResponse {
    
    private Long id;
    private String bookingNumber;
    private Long userId;
    private Long vehicleId;
    private Long driverId;
    private BookingStatus status;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private LocalDateTime actualStartDateTime;
    private LocalDateTime actualEndDateTime;
    private String pickupLocation;
    private Double pickupLatitude;
    private Double pickupLongitude;
    private String dropoffLocation;
    private Double dropoffLatitude;
    private Double dropoffLongitude;
    private Boolean withDriver;
    private BigDecimal vehiclePrice;
    private BigDecimal driverPrice;
    private BigDecimal totalPrice;
    private BigDecimal discountAmount;
    private BigDecimal finalPrice;
    private Long paymentId;
    private Boolean paymentCompleted;
    private String cancellationReason;
    private LocalDateTime cancelledAt;
    private Integer distanceKm;
    private String specialRequests;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}






