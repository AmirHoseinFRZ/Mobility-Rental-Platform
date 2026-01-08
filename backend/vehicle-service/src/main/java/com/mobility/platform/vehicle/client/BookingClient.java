package com.mobility.platform.vehicle.client;

import com.mobility.platform.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

/**
 * Feign client for Booking Service
 */
@FeignClient(name = "booking-service", path = "/api/bookings")
public interface BookingClient {
    
    @GetMapping("/booked-vehicles")
    ApiResponse<List<Long>> getBookedVehicleIds(
            @RequestParam("startDateTime") String startDateTime,
            @RequestParam("endDateTime") String endDateTime);
}

