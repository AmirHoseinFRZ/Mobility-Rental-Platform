package com.mobility.platform.review.entity;

import com.mobility.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Review entity for vehicles and drivers
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reviews", indexes = {
        @Index(name = "idx_user_id", columnList = "userId"),
        @Index(name = "idx_vehicle_id", columnList = "vehicleId"),
        @Index(name = "idx_driver_id", columnList = "driverId"),
        @Index(name = "idx_booking_id", columnList = "bookingId")
})
public class Review extends BaseEntity {
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false)
    private Long bookingId;
    
    private Long vehicleId; // Review for vehicle
    
    private Long driverId; // Review for driver (if with-driver booking)
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReviewType reviewType; // VEHICLE, DRIVER
    
    @Column(nullable = false)
    private Integer rating; // 1-5 stars
    
    @Column(length = 2000)
    private String comment;
    
    @Column(length = 500)
    private String response; // Response from admin/company
    
    @Column(nullable = false)
    private Boolean verified = false; // Verified after booking completion
    
    @Column(nullable = false)
    private Boolean approved = true; // For moderation
    
    private Boolean helpful; // Marked as helpful by others
    
    private Integer helpfulCount = 0;
    
    public enum ReviewType {
        VEHICLE,
        DRIVER
    }
}
