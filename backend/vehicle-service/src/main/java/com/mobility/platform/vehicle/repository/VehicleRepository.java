package com.mobility.platform.vehicle.repository;

import com.mobility.platform.common.enums.VehicleStatus;
import com.mobility.platform.vehicle.entity.Vehicle;
import org.locationtech.jts.geom.Point;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Vehicle repository with PostGIS spatial queries
 */
@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    
    Optional<Vehicle> findByVehicleNumber(String vehicleNumber);
    
    Optional<Vehicle> findByLicensePlate(String licensePlate);
    
    List<Vehicle> findByStatus(VehicleStatus status);
    
    List<Vehicle> findByVehicleType(String vehicleType);
    
    List<Vehicle> findByAvailable(Boolean available);
    
    @Query("SELECT v FROM Vehicle v WHERE v.status = 'AVAILABLE' AND v.available = true")
    List<Vehicle> findAvailableVehicles();
    
    @Query("SELECT v FROM Vehicle v WHERE v.vehicleType = :vehicleType AND v.status = 'AVAILABLE' AND v.available = true")
    List<Vehicle> findAvailableVehiclesByType(@Param("vehicleType") String vehicleType);
    
    // PostGIS spatial queries
    @Query(value = "SELECT * FROM vehicles v " +
            "WHERE v.status = 'AVAILABLE' " +
            "AND v.available = true " +
            "AND ST_DWithin(v.current_location, :location, :radiusMeters) " +
            "ORDER BY ST_Distance(v.current_location, :location)", 
            nativeQuery = true)
    List<Vehicle> findAvailableVehiclesWithinRadius(
            @Param("location") Point location, 
            @Param("radiusMeters") double radiusMeters);
    
    @Query(value = "SELECT * FROM vehicles v " +
            "WHERE v.vehicle_type = :vehicleType " +
            "AND v.status = 'AVAILABLE' " +
            "AND v.available = true " +
            "AND ST_DWithin(v.current_location, :location, :radiusMeters) " +
            "ORDER BY ST_Distance(v.current_location, :location)", 
            nativeQuery = true)
    List<Vehicle> findAvailableVehiclesByTypeWithinRadius(
            @Param("vehicleType") String vehicleType,
            @Param("location") Point location, 
            @Param("radiusMeters") double radiusMeters);
    
    @Query(value = "SELECT * FROM vehicles v " +
            "ORDER BY ST_Distance(v.current_location, :location) " +
            "LIMIT :limit", 
            nativeQuery = true)
    List<Vehicle> findNearestVehicles(
            @Param("location") Point location, 
            @Param("limit") int limit);
    
    @Query("SELECT v FROM Vehicle v WHERE v.requiresDriver = :requiresDriver AND v.status = 'AVAILABLE'")
    List<Vehicle> findVehiclesByDriverRequirement(@Param("requiresDriver") Boolean requiresDriver);
}





