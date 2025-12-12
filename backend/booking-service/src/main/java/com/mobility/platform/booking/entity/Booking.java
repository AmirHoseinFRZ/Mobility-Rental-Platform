package com.mobility.platform.booking.entity;

import com.mobility.platform.common.entity.BaseEntity;
import com.mobility.platform.common.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Booking entity
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bookings", indexes = {
        @Index(name = "idx_booking_number", columnList = "bookingNumber"),
        @Index(name = "idx_user_id", columnList = "userId"),
        @Index(name = "idx_vehicle_id", columnList = "vehicleId"),
        @Index(name = "idx_status", columnList = "status"),
        @Index(name = "idx_start_date", columnList = "startDateTime")
})
public class Booking extends BaseEntity {
    
    @Column(unique = true, nullable = false)
    private String bookingNumber;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false)
    private Long vehicleId;
    
    private Long driverId; // Null if booking is without driver
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;
    
    @Column(nullable = false)
    private LocalDateTime startDateTime;
    
    @Column(nullable = false)
    private LocalDateTime endDateTime;
    
    private LocalDateTime actualStartDateTime;
    
    private LocalDateTime actualEndDateTime;
    
    @Column(nullable = false)
    private String pickupLocation;
    
    private Double pickupLatitude;
    
    private Double pickupLongitude;
    
    private String dropoffLocation;
    
    private Double dropoffLatitude;
    
    private Double dropoffLongitude;
    
    @Column(nullable = false)
    private Boolean withDriver = false;
    
    @Column(nullable = false)
    private BigDecimal vehiclePrice;
    
    private BigDecimal driverPrice;
    
    @Column(nullable = false)
    private BigDecimal totalPrice;
    
    private BigDecimal discountAmount;
    
    private BigDecimal finalPrice;
    
    private Long paymentId; // Reference to payment service
    
    @Column(nullable = false)
    private Boolean paymentCompleted = false;
    
    private String cancellationReason;
    
    private LocalDateTime cancelledAt;
    
    private Integer distanceKm;
    
    @Column(length = 1000)
    private String specialRequests;
    
    @Column(length = 2000)
    private String notes;
}


