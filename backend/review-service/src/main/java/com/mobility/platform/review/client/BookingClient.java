package com.mobility.platform.review.client;

import com.mobility.platform.common.dto.ApiResponse;
import com.mobility.platform.review.client.dto.BookingInfoDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Feign client for Booking Service - used to validate that the user
 * has a completed booking before allowing a review.
 */
@FeignClient(name = "booking-service", path = "/api/bookings")
public interface BookingClient {
    
    @GetMapping("/{id}")
    ApiResponse<BookingInfoDto> getBookingById(@PathVariable("id") Long id);
}
