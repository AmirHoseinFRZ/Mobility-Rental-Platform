package com.mobility.platform.booking.scheduler;

import com.mobility.platform.booking.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler that auto-completes expired ONGOING bookings and releases vehicles
 * for CONFIRMED bookings whose end time has passed, so vehicles become available again.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BookingExpiryScheduler {

    private final BookingService bookingService;

    /** Run every minute to process expired bookings and release vehicles. */
    @Scheduled(fixedRate = 60000)
    public void processExpiredBookings() {
        try {
            bookingService.processExpiredBookings();
        } catch (Exception e) {
            log.error("Error in booking expiry scheduler", e);
        }
    }
}
