package com.mobility.platform.vehicle.controller;

import com.mobility.platform.common.dto.ApiResponse;
import com.mobility.platform.common.dto.PageResponse;
import com.mobility.platform.common.enums.VehicleStatus;
import com.mobility.platform.vehicle.dto.LocationSearchRequest;
import com.mobility.platform.vehicle.dto.VehicleRequest;
import com.mobility.platform.vehicle.dto.VehicleResponse;
import com.mobility.platform.vehicle.service.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Vehicle REST controller
 */
@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "Vehicle Management", description = "Vehicle inventory and location management")
public class VehicleController {
    
    private final VehicleService vehicleService;
    
    @PostMapping
    @Operation(summary = "Create new vehicle")
    public ResponseEntity<ApiResponse<VehicleResponse>> createVehicle(
            @Valid @RequestBody VehicleRequest request) {
        VehicleResponse response = vehicleService.createVehicle(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Vehicle created successfully", response));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get vehicle by ID")
    public ResponseEntity<ApiResponse<VehicleResponse>> getVehicleById(@PathVariable Long id) {
        VehicleResponse response = vehicleService.getVehicleById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/number/{vehicleNumber}")
    @Operation(summary = "Get vehicle by vehicle number")
    public ResponseEntity<ApiResponse<VehicleResponse>> getVehicleByNumber(
            @PathVariable String vehicleNumber) {
        VehicleResponse response = vehicleService.getVehicleByNumber(vehicleNumber);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping
    @Operation(summary = "Get all vehicles with pagination")
    public ResponseEntity<ApiResponse<PageResponse<VehicleResponse>>> getAllVehicles(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<VehicleResponse> response = vehicleService.getAllVehicles(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/available")
    @Operation(summary = "Get all available vehicles")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> getAvailableVehicles() {
        List<VehicleResponse> response = vehicleService.getAvailableVehicles();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/available/type/{vehicleType}")
    @Operation(summary = "Get available vehicles by type")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> getAvailableVehiclesByType(
            @PathVariable String vehicleType) {
        List<VehicleResponse> response = vehicleService.getAvailableVehiclesByType(vehicleType);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @PostMapping("/search/location")
    @Operation(summary = "Search vehicles by location and radius")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> searchVehiclesByLocation(
            @Valid @RequestBody LocationSearchRequest request) {
        List<VehicleResponse> response = vehicleService.searchVehiclesByLocation(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/nearest")
    @Operation(summary = "Get nearest vehicles to a location")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> getNearestVehicles(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "10") Integer limit) {
        List<VehicleResponse> response = vehicleService.getNearestVehicles(latitude, longitude, limit);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update vehicle")
    public ResponseEntity<ApiResponse<VehicleResponse>> updateVehicle(
            @PathVariable Long id,
            @Valid @RequestBody VehicleRequest request) {
        VehicleResponse response = vehicleService.updateVehicle(id, request);
        return ResponseEntity.ok(ApiResponse.success("Vehicle updated successfully", response));
    }
    
    @PatchMapping("/{id}/status")
    @Operation(summary = "Update vehicle status")
    public ResponseEntity<ApiResponse<VehicleResponse>> updateVehicleStatus(
            @PathVariable Long id,
            @RequestParam VehicleStatus status) {
        VehicleResponse response = vehicleService.updateVehicleStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Vehicle status updated successfully", response));
    }
    
    @PatchMapping("/{id}/location")
    @Operation(summary = "Update vehicle location")
    public ResponseEntity<ApiResponse<VehicleResponse>> updateVehicleLocation(
            @PathVariable Long id,
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false) String address) {
        VehicleResponse response = vehicleService.updateVehicleLocation(id, latitude, longitude, address);
        return ResponseEntity.ok(ApiResponse.success("Vehicle location updated successfully", response));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete vehicle")
    public ResponseEntity<ApiResponse<Void>> deleteVehicle(@PathVariable Long id) {
        vehicleService.deleteVehicle(id);
        return ResponseEntity.ok(ApiResponse.success("Vehicle deleted successfully", null));
    }
    
    @GetMapping("/health")
    @Operation(summary = "Health check")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("Vehicle service is running", "OK"));
    }
}

