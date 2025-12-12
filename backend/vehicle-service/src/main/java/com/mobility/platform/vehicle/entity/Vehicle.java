package com.mobility.platform.vehicle.entity;

import com.mobility.platform.common.entity.BaseEntity;
import com.mobility.platform.common.enums.VehicleStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Point;

import java.math.BigDecimal;

/**
 * Vehicle entity with PostGIS location support
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "vehicles", indexes = {
        @Index(name = "idx_vehicle_number", columnList = "vehicleNumber"),
        @Index(name = "idx_vehicle_type", columnList = "vehicleType"),
        @Index(name = "idx_status", columnList = "status")
})
public class Vehicle extends BaseEntity {
    
    @Column(unique = true, nullable = false)
    private String vehicleNumber;
    
    @Column(nullable = false)
    private String brand;
    
    @Column(nullable = false)
    private String model;
    
    @Column(nullable = false)
    private Integer year;
    
    @Column(nullable = false)
    private String vehicleType; // CAR, BIKE, SCOOTER, BICYCLE, etc.
    
    private String color;
    
    @Column(unique = true)
    private String licensePlate;
    
    @Column(nullable = false)
    private Integer seatingCapacity;
    
    private String fuelType; // PETROL, DIESEL, ELECTRIC, HYBRID
    
    private String transmission; // MANUAL, AUTOMATIC
    
    @Column(nullable = false)
    private BigDecimal pricePerHour;
    
    @Column(nullable = false)
    private BigDecimal pricePerDay;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleStatus status = VehicleStatus.AVAILABLE;
    
    @Column(columnDefinition = "geometry(Point,4326)")
    private Point currentLocation;
    
    private String currentAddress;
    
    private String currentCity;
    
    @Column(nullable = false)
    private Integer totalKilometers = 0;
    
    private String imageUrl;
    
    @Column(length = 1000)
    private String description;
    
    @Column(length = 1000)
    private String features; // JSON string or comma-separated features
    
    @Column(nullable = false)
    private Boolean available = true;
    
    @Column(nullable = false)
    private Boolean requiresDriver = false;
    
    private BigDecimal driverPricePerHour;
    
    private BigDecimal driverPricePerDay;
    
    private Integer maintenanceDueKm;
    
    private java.time.LocalDate lastMaintenanceDate;
    
    private java.time.LocalDate nextMaintenanceDate;
    
    private java.time.LocalDate insuranceExpiryDate;
    
    @Column(nullable = false)
    private Double rating = 0.0;
    
    @Column(nullable = false)
    private Integer totalReviews = 0;
}






