package com.mobility.platform.driver.service;

import com.mobility.platform.common.exception.BusinessException;
import com.mobility.platform.common.exception.ResourceNotFoundException;
import com.mobility.platform.driver.dto.DriverRequest;
import com.mobility.platform.driver.dto.DriverResponse;
import com.mobility.platform.driver.entity.Driver;
import com.mobility.platform.driver.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DriverService {
    
    private final DriverRepository driverRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    
    @Transactional
    public DriverResponse registerDriver(DriverRequest request) {
        log.info("Registering new driver for user: {}", request.getUserId());
        
        if (driverRepository.findByUserId(request.getUserId()).isPresent()) {
            throw new BusinessException("Driver already registered for this user", "DRIVER_EXISTS");
        }
        
        Driver driver = new Driver();
        driver.setUserId(request.getUserId());
        driver.setLicenseNumber(request.getLicenseNumber());
        driver.setLicenseExpiryDate(request.getLicenseExpiryDate());
        driver.setLicenseType(request.getLicenseType());
        driver.setVehiclePreference(request.getVehiclePreference());
        driver.setBio(request.getBio());
        driver.setProfileImageUrl(request.getProfileImageUrl());
        driver.setJoinDate(LocalDate.now());
        driver.setCurrentAddress(request.getCurrentAddress());
        driver.setCurrentCity(request.getCurrentCity());
        
        if (request.getLatitude() != null && request.getLongitude() != null) {
            Point location = createPoint(request.getLatitude(), request.getLongitude());
            driver.setCurrentLocation(location);
        }
        
        driver = driverRepository.save(driver);
        return mapToResponse(driver, null);
    }
    
    public DriverResponse getDriverById(Long id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", id));
        return mapToResponse(driver, null);
    }
    
    public DriverResponse getDriverByUserId(Long userId) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "userId", userId));
        return mapToResponse(driver, null);
    }
    
    public List<DriverResponse> getAvailableDrivers() {
        return driverRepository.findAvailableDrivers().stream()
                .map(d -> mapToResponse(d, null))
                .collect(Collectors.toList());
    }
    
    public List<DriverResponse> findNearestDrivers(Double latitude, Double longitude, Integer limit) {
        Point location = createPoint(latitude, longitude);
        return driverRepository.findNearestAvailableDrivers(location, limit).stream()
                .map(d -> {
                    Double distance = calculateDistance(location, d.getCurrentLocation());
                    return mapToResponse(d, distance);
                })
                .collect(Collectors.toList());
    }
    
    @Transactional
    public DriverResponse updateLocation(Long id, Double latitude, Double longitude) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", id));
        
        Point location = createPoint(latitude, longitude);
        driver.setCurrentLocation(location);
        driver.setLastActiveDate(LocalDate.now());
        
        driver = driverRepository.save(driver);
        return mapToResponse(driver, null);
    }
    
    @Transactional
    public DriverResponse updateStatus(Long id, Driver.DriverStatus status) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", id));
        
        driver.setStatus(status);
        driver.setAvailable(status == Driver.DriverStatus.ONLINE);
        
        driver = driverRepository.save(driver);
        return mapToResponse(driver, null);
    }
    
    private Point createPoint(Double latitude, Double longitude) {
        return geometryFactory.createPoint(new Coordinate(longitude, latitude));
    }
    
    private Double calculateDistance(Point point1, Point point2) {
        if (point1 == null || point2 == null) return null;
        
        double lat1 = Math.toRadians(point1.getY());
        double lat2 = Math.toRadians(point2.getY());
        double lon1 = Math.toRadians(point1.getX());
        double lon2 = Math.toRadians(point2.getX());
        
        double dLat = lat2 - lat1;
        double dLon = lon2 - lon1;
        
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return 6371 * c;
    }
    
    private DriverResponse mapToResponse(Driver driver, Double distanceKm) {
        DriverResponse response = new DriverResponse();
        response.setId(driver.getId());
        response.setUserId(driver.getUserId());
        response.setLicenseNumber(driver.getLicenseNumber());
        response.setLicenseExpiryDate(driver.getLicenseExpiryDate());
        response.setLicenseType(driver.getLicenseType());
        response.setStatus(driver.getStatus());
        response.setAvailable(driver.getAvailable());
        response.setVerified(driver.getVerified());
        
        if (driver.getCurrentLocation() != null) {
            response.setLatitude(driver.getCurrentLocation().getY());
            response.setLongitude(driver.getCurrentLocation().getX());
        }
        
        response.setCurrentAddress(driver.getCurrentAddress());
        response.setCurrentCity(driver.getCurrentCity());
        response.setRating(driver.getRating());
        response.setTotalTrips(driver.getTotalTrips());
        response.setTotalReviews(driver.getTotalReviews());
        response.setTotalEarnings(driver.getTotalEarnings());
        response.setVehiclePreference(driver.getVehiclePreference());
        response.setBio(driver.getBio());
        response.setProfileImageUrl(driver.getProfileImageUrl());
        response.setJoinDate(driver.getJoinDate());
        response.setLastActiveDate(driver.getLastActiveDate());
        response.setAcceptanceRate(driver.getAcceptanceRate());
        response.setCompletionRate(driver.getCompletionRate());
        response.setCreatedAt(driver.getCreatedAt());
        response.setDistanceKm(distanceKm);
        
        return response;
    }
}


