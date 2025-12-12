package com.mobility.platform.driver.repository;

import com.mobility.platform.driver.entity.Driver;
import org.locationtech.jts.geom.Point;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {
    
    Optional<Driver> findByUserId(Long userId);
    
    Optional<Driver> findByLicenseNumber(String licenseNumber);
    
    List<Driver> findByStatus(Driver.DriverStatus status);
    
    List<Driver> findByAvailable(Boolean available);
    
    @Query("SELECT d FROM Driver d WHERE d.status = 'ONLINE' AND d.available = true")
    List<Driver> findAvailableDrivers();
    
    @Query(value = "SELECT * FROM drivers d " +
            "WHERE d.status = 'ONLINE' " +
            "AND d.available = true " +
            "AND ST_DWithin(d.current_location, :location, :radiusMeters) " +
            "ORDER BY ST_Distance(d.current_location, :location)", 
            nativeQuery = true)
    List<Driver> findAvailableDriversWithinRadius(
            @Param("location") Point location, 
            @Param("radiusMeters") double radiusMeters);
    
    @Query(value = "SELECT * FROM drivers d " +
            "WHERE d.status = 'ONLINE' " +
            "AND d.available = true " +
            "ORDER BY ST_Distance(d.current_location, :location) " +
            "LIMIT :limit", 
            nativeQuery = true)
    List<Driver> findNearestAvailableDrivers(
            @Param("location") Point location, 
            @Param("limit") int limit);
}





