package com.mobility.platform.driver.controller;

import com.mobility.platform.common.dto.ApiResponse;
import com.mobility.platform.driver.dto.DriverRequest;
import com.mobility.platform.driver.dto.DriverResponse;
import com.mobility.platform.driver.entity.Driver;
import com.mobility.platform.driver.service.DriverService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
@Tag(name = "Driver Management", description = "Driver registration, availability, and assignment")
public class DriverController {
    
    private final DriverService driverService;
    
    @PostMapping
    @Operation(summary = "Register new driver")
    public ResponseEntity<ApiResponse<DriverResponse>> registerDriver(@Valid @RequestBody DriverRequest request) {
        DriverResponse response = driverService.registerDriver(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Driver registered successfully", response));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get driver by ID")
    public ResponseEntity<ApiResponse<DriverResponse>> getDriverById(@PathVariable Long id) {
        DriverResponse response = driverService.getDriverById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/user/{userId}")
    @Operation(summary = "Get driver by user ID")
    public ResponseEntity<ApiResponse<DriverResponse>> getDriverByUserId(@PathVariable Long userId) {
        DriverResponse response = driverService.getDriverByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/available")
    @Operation(summary = "Get all available drivers")
    public ResponseEntity<ApiResponse<List<DriverResponse>>> getAvailableDrivers() {
        List<DriverResponse> drivers = driverService.getAvailableDrivers();
        return ResponseEntity.ok(ApiResponse.success(drivers));
    }
    
    @GetMapping("/nearest")
    @Operation(summary = "Find nearest available drivers")
    public ResponseEntity<ApiResponse<List<DriverResponse>>> findNearestDrivers(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "5") Integer limit) {
        List<DriverResponse> drivers = driverService.findNearestDrivers(latitude, longitude, limit);
        return ResponseEntity.ok(ApiResponse.success(drivers));
    }
    
    @PatchMapping("/{id}/location")
    @Operation(summary = "Update driver location")
    public ResponseEntity<ApiResponse<DriverResponse>> updateLocation(
            @PathVariable Long id,
            @RequestParam Double latitude,
            @RequestParam Double longitude) {
        DriverResponse response = driverService.updateLocation(id, latitude, longitude);
        return ResponseEntity.ok(ApiResponse.success("Location updated", response));
    }
    
    @PatchMapping("/{id}/status")
    @Operation(summary = "Update driver status")
    public ResponseEntity<ApiResponse<DriverResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam Driver.DriverStatus status) {
        DriverResponse response = driverService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Status updated", response));
    }
    
    @GetMapping("/health")
    @Operation(summary = "Health check")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("Driver service is running", "OK"));
    }
}

