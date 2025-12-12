package com.mobility.platform.vehicle.service;

import com.mobility.platform.common.dto.PageResponse;
import com.mobility.platform.common.enums.VehicleStatus;
import com.mobility.platform.common.event.EventPublisher;
import com.mobility.platform.common.exception.BusinessException;
import com.mobility.platform.common.exception.ResourceNotFoundException;
import com.mobility.platform.vehicle.dto.LocationSearchRequest;
import com.mobility.platform.vehicle.dto.VehicleRequest;
import com.mobility.platform.vehicle.dto.VehicleResponse;
import com.mobility.platform.vehicle.entity.Vehicle;
import com.mobility.platform.vehicle.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Vehicle service implementation with PostGIS support
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VehicleService {
    
    private final VehicleRepository vehicleRepository;
    private final EventPublisher eventPublisher;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    
    @Transactional
    public VehicleResponse createVehicle(VehicleRequest request) {
        log.info("Creating new vehicle: {}", request.getVehicleNumber());
        
        // Check if vehicle already exists
        if (vehicleRepository.findByVehicleNumber(request.getVehicleNumber()).isPresent()) {
            throw new BusinessException("Vehicle number already exists", "VEHICLE_EXISTS");
        }
        
        Vehicle vehicle = new Vehicle();
        mapRequestToEntity(request, vehicle);
        
        vehicle = vehicleRepository.save(vehicle);
        
        // Publish vehicle created event
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("vehicleId", vehicle.getId());
        eventData.put("vehicleNumber", vehicle.getVehicleNumber());
        eventData.put("vehicleType", vehicle.getVehicleType());
        eventPublisher.publishVehicleEvent("status.created", eventData);
        
        log.info("Vehicle created successfully with ID: {}", vehicle.getId());
        
        return mapToResponse(vehicle, null);
    }
    
    public VehicleResponse getVehicleById(Long id) {
        log.info("Fetching vehicle by ID: {}", id);
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));
        return mapToResponse(vehicle, null);
    }
    
    public VehicleResponse getVehicleByNumber(String vehicleNumber) {
        log.info("Fetching vehicle by number: {}", vehicleNumber);
        Vehicle vehicle = vehicleRepository.findByVehicleNumber(vehicleNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "vehicleNumber", vehicleNumber));
        return mapToResponse(vehicle, null);
    }
    
    public PageResponse<VehicleResponse> getAllVehicles(Pageable pageable) {
        log.info("Fetching all vehicles with pagination");
        Page<Vehicle> vehiclePage = vehicleRepository.findAll(pageable);
        
        List<VehicleResponse> vehicles = vehiclePage.getContent().stream()
                .map(v -> mapToResponse(v, null))
                .collect(Collectors.toList());
        
        return buildPageResponse(vehiclePage, vehicles);
    }
    
    public List<VehicleResponse> getAvailableVehicles() {
        log.info("Fetching all available vehicles");
        List<Vehicle> vehicles = vehicleRepository.findAvailableVehicles();
        return vehicles.stream()
                .map(v -> mapToResponse(v, null))
                .collect(Collectors.toList());
    }
    
    public List<VehicleResponse> getAvailableVehiclesByType(String vehicleType) {
        log.info("Fetching available vehicles by type: {}", vehicleType);
        List<Vehicle> vehicles = vehicleRepository.findAvailableVehiclesByType(vehicleType);
        return vehicles.stream()
                .map(v -> mapToResponse(v, null))
                .collect(Collectors.toList());
    }
    
    public List<VehicleResponse> searchVehiclesByLocation(LocationSearchRequest request) {
        log.info("Searching vehicles near location: lat={}, lon={}, radius={}km", 
                request.getLatitude(), request.getLongitude(), request.getRadiusKm());
        
        Point searchLocation = createPoint(request.getLatitude(), request.getLongitude());
        double radiusMeters = request.getRadiusKm() * 1000; // Convert km to meters
        
        List<Vehicle> vehicles;
        if (request.getVehicleType() != null) {
            vehicles = vehicleRepository.findAvailableVehiclesByTypeWithinRadius(
                    request.getVehicleType(), searchLocation, radiusMeters);
        } else {
            vehicles = vehicleRepository.findAvailableVehiclesWithinRadius(
                    searchLocation, radiusMeters);
        }
        
        return vehicles.stream()
                .map(v -> {
                    Double distance = calculateDistance(searchLocation, v.getCurrentLocation());
                    return mapToResponse(v, distance);
                })
                .collect(Collectors.toList());
    }
    
    public List<VehicleResponse> getNearestVehicles(Double latitude, Double longitude, Integer limit) {
        log.info("Fetching nearest {} vehicles to location: lat={}, lon={}", limit, latitude, longitude);
        
        Point searchLocation = createPoint(latitude, longitude);
        List<Vehicle> vehicles = vehicleRepository.findNearestVehicles(searchLocation, limit);
        
        return vehicles.stream()
                .map(v -> {
                    Double distance = calculateDistance(searchLocation, v.getCurrentLocation());
                    return mapToResponse(v, distance);
                })
                .collect(Collectors.toList());
    }
    
    @Transactional
    public VehicleResponse updateVehicle(Long id, VehicleRequest request) {
        log.info("Updating vehicle: {}", id);
        
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));
        
        mapRequestToEntity(request, vehicle);
        vehicle = vehicleRepository.save(vehicle);
        
        log.info("Vehicle updated successfully: {}", id);
        
        return mapToResponse(vehicle, null);
    }
    
    @Transactional
    public VehicleResponse updateVehicleStatus(Long id, VehicleStatus status) {
        log.info("Updating vehicle status: {} to {}", id, status);
        
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));
        
        VehicleStatus oldStatus = vehicle.getStatus();
        vehicle.setStatus(status);
        
        if (status == VehicleStatus.AVAILABLE) {
            vehicle.setAvailable(true);
        } else {
            vehicle.setAvailable(false);
        }
        
        vehicle = vehicleRepository.save(vehicle);
        
        // Publish status update event
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("vehicleId", vehicle.getId());
        eventData.put("oldStatus", oldStatus);
        eventData.put("newStatus", status);
        eventPublisher.publishVehicleEvent("status.updated", eventData);
        
        log.info("Vehicle status updated successfully: {}", id);
        
        return mapToResponse(vehicle, null);
    }
    
    @Transactional
    public VehicleResponse updateVehicleLocation(Long id, Double latitude, Double longitude, String address) {
        log.info("Updating vehicle location: {}", id);
        
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));
        
        Point newLocation = createPoint(latitude, longitude);
        vehicle.setCurrentLocation(newLocation);
        
        if (address != null) {
            vehicle.setCurrentAddress(address);
        }
        
        vehicle = vehicleRepository.save(vehicle);
        
        // Publish location update event
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("vehicleId", vehicle.getId());
        eventData.put("latitude", latitude);
        eventData.put("longitude", longitude);
        eventPublisher.publishVehicleEvent("location.updated", eventData);
        
        log.info("Vehicle location updated successfully: {}", id);
        
        return mapToResponse(vehicle, null);
    }
    
    @Transactional
    public void deleteVehicle(Long id) {
        log.info("Deleting vehicle: {}", id);
        
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));
        
        if (vehicle.getStatus() == VehicleStatus.IN_USE || vehicle.getStatus() == VehicleStatus.BOOKED) {
            throw new BusinessException("Cannot delete vehicle that is in use or booked", "VEHICLE_IN_USE");
        }
        
        vehicleRepository.delete(vehicle);
        log.info("Vehicle deleted successfully: {}", id);
    }
    
    private void mapRequestToEntity(VehicleRequest request, Vehicle vehicle) {
        vehicle.setVehicleNumber(request.getVehicleNumber());
        vehicle.setBrand(request.getBrand());
        vehicle.setModel(request.getModel());
        vehicle.setYear(request.getYear());
        vehicle.setVehicleType(request.getVehicleType());
        vehicle.setColor(request.getColor());
        vehicle.setLicensePlate(request.getLicensePlate());
        vehicle.setSeatingCapacity(request.getSeatingCapacity());
        vehicle.setFuelType(request.getFuelType());
        vehicle.setTransmission(request.getTransmission());
        vehicle.setPricePerHour(request.getPricePerHour());
        vehicle.setPricePerDay(request.getPricePerDay());
        vehicle.setCurrentAddress(request.getCurrentAddress());
        vehicle.setCurrentCity(request.getCurrentCity());
        vehicle.setImageUrl(request.getImageUrl());
        vehicle.setDescription(request.getDescription());
        vehicle.setFeatures(request.getFeatures());
        vehicle.setRequiresDriver(request.getRequiresDriver() != null ? request.getRequiresDriver() : false);
        vehicle.setDriverPricePerHour(request.getDriverPricePerHour());
        vehicle.setDriverPricePerDay(request.getDriverPricePerDay());
        
        if (request.getLatitude() != null && request.getLongitude() != null) {
            Point location = createPoint(request.getLatitude(), request.getLongitude());
            vehicle.setCurrentLocation(location);
        }
    }
    
    private VehicleResponse mapToResponse(Vehicle vehicle, Double distanceKm) {
        VehicleResponse response = new VehicleResponse();
        response.setId(vehicle.getId());
        response.setVehicleNumber(vehicle.getVehicleNumber());
        response.setBrand(vehicle.getBrand());
        response.setModel(vehicle.getModel());
        response.setYear(vehicle.getYear());
        response.setVehicleType(vehicle.getVehicleType());
        response.setColor(vehicle.getColor());
        response.setLicensePlate(vehicle.getLicensePlate());
        response.setSeatingCapacity(vehicle.getSeatingCapacity());
        response.setFuelType(vehicle.getFuelType());
        response.setTransmission(vehicle.getTransmission());
        response.setPricePerHour(vehicle.getPricePerHour());
        response.setPricePerDay(vehicle.getPricePerDay());
        response.setStatus(vehicle.getStatus());
        
        if (vehicle.getCurrentLocation() != null) {
            response.setLatitude(vehicle.getCurrentLocation().getY());
            response.setLongitude(vehicle.getCurrentLocation().getX());
        }
        
        response.setCurrentAddress(vehicle.getCurrentAddress());
        response.setCurrentCity(vehicle.getCurrentCity());
        response.setTotalKilometers(vehicle.getTotalKilometers());
        response.setImageUrl(vehicle.getImageUrl());
        response.setDescription(vehicle.getDescription());
        response.setFeatures(vehicle.getFeatures());
        response.setAvailable(vehicle.getAvailable());
        response.setRequiresDriver(vehicle.getRequiresDriver());
        response.setDriverPricePerHour(vehicle.getDriverPricePerHour());
        response.setDriverPricePerDay(vehicle.getDriverPricePerDay());
        response.setLastMaintenanceDate(vehicle.getLastMaintenanceDate());
        response.setNextMaintenanceDate(vehicle.getNextMaintenanceDate());
        response.setInsuranceExpiryDate(vehicle.getInsuranceExpiryDate());
        response.setRating(vehicle.getRating());
        response.setTotalReviews(vehicle.getTotalReviews());
        response.setCreatedAt(vehicle.getCreatedAt());
        response.setUpdatedAt(vehicle.getUpdatedAt());
        response.setDistanceKm(distanceKm);
        
        return response;
    }
    
    private Point createPoint(Double latitude, Double longitude) {
        return geometryFactory.createPoint(new Coordinate(longitude, latitude));
    }
    
    private Double calculateDistance(Point point1, Point point2) {
        if (point1 == null || point2 == null) {
            return null;
        }
        
        // Haversine formula for distance calculation
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
        double earthRadiusKm = 6371;
        
        return earthRadiusKm * c;
    }
    
    private <T> PageResponse<T> buildPageResponse(Page<?> page, List<T> content) {
        return PageResponse.<T>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .empty(page.isEmpty())
                .build();
    }
}


