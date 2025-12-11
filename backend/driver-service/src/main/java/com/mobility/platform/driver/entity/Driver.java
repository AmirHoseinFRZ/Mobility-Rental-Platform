package com.mobility.platform.driver.entity;

import com.mobility.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Point;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Driver entity with PostGIS location tracking
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "drivers", indexes = {
        @Index(name = "idx_user_id", columnList = "userId"),
        @Index(name = "idx_license", columnList = "licenseNumber"),
        @Index(name = "idx_status", columnList = "status")
})
public class Driver extends BaseEntity {
    
    @Column(nullable = false, unique = true)
    private Long userId; // Reference to user service
    
    @Column(unique = true, nullable = false)
    private String licenseNumber;
    
    @Column(nullable = false)
    private LocalDate licenseExpiryDate;
    
    @Column(nullable = false)
    private String licenseType; // A, B, C, D, etc.
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DriverStatus status = DriverStatus.OFFLINE;
    
    @Column(nullable = false)
    private Boolean available = false;
    
    @Column(nullable = false)
    private Boolean verified = false;
    
    @Column(columnDefinition = "geometry(Point,4326)")
    private Point currentLocation;
    
    private String currentAddress;
    
    private String currentCity;
    
    @Column(nullable = false)
    private Double rating = 0.0;
    
    @Column(nullable = false)
    private Integer totalTrips = 0;
    
    @Column(nullable = false)
    private Integer totalReviews = 0;
    
    @Column(nullable = false)
    private BigDecimal totalEarnings = BigDecimal.ZERO;
    
    private String vehiclePreference; // CAR, BIKE, SCOOTER, etc.
    
    @Column(length = 1000)
    private String bio;
    
    private String profileImageUrl;
    
    private LocalDate joinDate;
    
    private LocalDate lastActiveDate;
    
    @Column(nullable = false)
    private Integer acceptanceRate = 100; // Percentage
    
    @Column(nullable = false)
    private Integer completionRate = 100; // Percentage
    
    public enum DriverStatus {
        ONLINE,
        OFFLINE,
        ON_TRIP,
        BUSY,
        SUSPENDED
    }
}

