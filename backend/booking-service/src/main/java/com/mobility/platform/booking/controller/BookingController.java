package com.mobility.platform.booking.controller;

import com.mobility.platform.booking.dto.BookingRequest;
import com.mobility.platform.booking.dto.BookingResponse;
import com.mobility.platform.booking.service.BookingService;
import com.mobility.platform.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Booking REST controller
 */
@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "Booking Management", description = "Booking and reservation management")
public class BookingController {
    
    private final BookingService bookingService;
    
    @PostMapping
    @Operation(summary = "Create new booking")
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @Valid @RequestBody BookingRequest request) {
        BookingResponse response = bookingService.createBooking(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Booking created successfully", response));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get booking by ID")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(@PathVariable Long id) {
        BookingResponse response = bookingService.getBookingById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/number/{bookingNumber}")
    @Operation(summary = "Get booking by booking number")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingByNumber(
            @PathVariable String bookingNumber) {
        BookingResponse response = bookingService.getBookingByNumber(bookingNumber);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/user/{userId}")
    @Operation(summary = "Get bookings by user ID")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getUserBookings(@PathVariable Long userId) {
        List<BookingResponse> response = bookingService.getUserBookings(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/vehicle/{vehicleId}")
    @Operation(summary = "Get bookings by vehicle ID")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getVehicleBookings(@PathVariable Long vehicleId) {
        List<BookingResponse> response = bookingService.getVehicleBookings(vehicleId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @PatchMapping("/{id}/confirm")
    @Operation(summary = "Confirm booking")
    public ResponseEntity<ApiResponse<BookingResponse>> confirmBooking(@PathVariable Long id) {
        BookingResponse response = bookingService.confirmBooking(id);
        return ResponseEntity.ok(ApiResponse.success("Booking confirmed successfully", response));
    }
    
    @PatchMapping("/{id}/start")
    @Operation(summary = "Start booking")
    public ResponseEntity<ApiResponse<BookingResponse>> startBooking(@PathVariable Long id) {
        BookingResponse response = bookingService.startBooking(id);
        return ResponseEntity.ok(ApiResponse.success("Booking started successfully", response));
    }
    
    @PatchMapping("/{id}/complete")
    @Operation(summary = "Complete booking")
    public ResponseEntity<ApiResponse<BookingResponse>> completeBooking(@PathVariable Long id) {
        BookingResponse response = bookingService.completeBooking(id);
        return ResponseEntity.ok(ApiResponse.success("Booking completed successfully", response));
    }
    
    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel booking")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        BookingResponse response = bookingService.cancelBooking(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Booking cancelled successfully", response));
    }
    
    @GetMapping("/health")
    @Operation(summary = "Health check")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("Booking service is running", "OK"));
    }
}


