package com.mobility.platform.booking.service;

import com.mobility.platform.booking.client.UserClient;
import com.mobility.platform.booking.client.VehicleClient;
import com.mobility.platform.booking.dto.BookingRequest;
import com.mobility.platform.booking.dto.BookingResponse;
import com.mobility.platform.booking.entity.Booking;
import com.mobility.platform.booking.repository.BookingRepository;
import com.mobility.platform.common.dto.ApiResponse;
import com.mobility.platform.common.enums.BookingStatus;
import com.mobility.platform.common.enums.VehicleStatus;
import com.mobility.platform.common.event.EventPublisher;
import com.mobility.platform.common.exception.BusinessException;
import com.mobility.platform.common.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Booking service implementation
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {
    
    private final BookingRepository bookingRepository;
    private final VehicleClient vehicleClient;
    private final UserClient userClient;
    private final EventPublisher eventPublisher;
    private final ObjectMapper objectMapper;
    
    @Transactional
    public BookingResponse createBooking(BookingRequest request) {
        log.info("Creating new booking for user {} and vehicle {}", request.getUserId(), request.getVehicleId());
        
        // Validate dates
        if (request.getEndDateTime().isBefore(request.getStartDateTime())) {
            throw new BusinessException("End date/time must be after start date/time", "INVALID_DATE_RANGE");
        }
        
        // Check for conflicting bookings
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                request.getVehicleId(),
                request.getStartDateTime(),
                request.getEndDateTime());
        
        if (!conflicts.isEmpty()) {
            throw new BusinessException("Vehicle is not available for the selected time period", "VEHICLE_NOT_AVAILABLE");
        }
        
        // Calculate price (use provided price from frontend if available, otherwise calculate)
        BigDecimal vehiclePrice = request.getVehiclePrice();
        BigDecimal driverPrice = request.getDriverPrice();
        BigDecimal totalPrice = request.getTotalPrice();
        
        // If prices not provided, calculate them (fallback for backward compatibility)
        if (totalPrice == null) {
            totalPrice = calculatePrice(request);
            vehiclePrice = totalPrice;
            driverPrice = request.getWithDriver() ? BigDecimal.valueOf(50) : BigDecimal.ZERO;
        } else {
            // Use provided prices, but ensure vehiclePrice and driverPrice are set
            if (vehiclePrice == null) {
                vehiclePrice = totalPrice.subtract(driverPrice != null ? driverPrice : BigDecimal.ZERO);
            }
            if (driverPrice == null) {
                driverPrice = request.getWithDriver() ? BigDecimal.valueOf(50) : BigDecimal.ZERO;
            }
        }
        
        // Create booking
        Booking booking = new Booking();
        booking.setBookingNumber(generateBookingNumber());
        booking.setUserId(request.getUserId());
        booking.setVehicleId(request.getVehicleId());
        booking.setDriverId(request.getDriverId());
        booking.setStatus(BookingStatus.PENDING);
        booking.setStartDateTime(request.getStartDateTime());
        booking.setEndDateTime(request.getEndDateTime());
        booking.setPickupLocation(request.getPickupLocation());
        booking.setPickupLatitude(request.getPickupLatitude());
        booking.setPickupLongitude(request.getPickupLongitude());
        booking.setDropoffLocation(request.getDropoffLocation());
        booking.setDropoffLatitude(request.getDropoffLatitude());
        booking.setDropoffLongitude(request.getDropoffLongitude());
        booking.setWithDriver(request.getWithDriver());
        booking.setVehiclePrice(vehiclePrice);
        booking.setDriverPrice(driverPrice);
        booking.setTotalPrice(totalPrice);
        booking.setFinalPrice(totalPrice);
        booking.setSpecialRequests(request.getSpecialRequests());
        
        booking = bookingRepository.save(booking);
        
        // Update vehicle status
        try {
            vehicleClient.updateVehicleStatus(request.getVehicleId(), VehicleStatus.BOOKED);
        } catch (Exception e) {
            log.error("Failed to update vehicle status", e);
        }
        
        // Publish booking created event
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("bookingId", booking.getId());
        eventData.put("bookingNumber", booking.getBookingNumber());
        eventData.put("userId", booking.getUserId());
        eventData.put("vehicleId", booking.getVehicleId());
        eventData.put("withDriver", booking.getWithDriver());
        eventPublisher.publishBookingEvent("created", eventData);
        
        log.info("Booking created successfully with ID: {}", booking.getId());
        
        return mapToResponse(booking);
    }
    
    public BookingResponse getBookingById(Long id) {
        log.info("Fetching booking by ID: {}", id);
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));
        return mapToResponse(booking);
    }
    
    public BookingResponse getBookingByNumber(String bookingNumber) {
        log.info("Fetching booking by number: {}", bookingNumber);
        Booking booking = bookingRepository.findByBookingNumber(bookingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "bookingNumber", bookingNumber));
        return mapToResponse(booking);
    }
    
    public List<BookingResponse> getUserBookings(Long userId) {
        log.info("Fetching bookings for user: {}", userId);
        List<Booking> bookings = bookingRepository.findByUserId(userId);
        return bookings.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<BookingResponse> getVehicleBookings(Long vehicleId) {
        log.info("Fetching bookings for vehicle: {}", vehicleId);
        List<Booking> bookings = bookingRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId);
        return bookings.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<Long> getBookedVehicleIds(LocalDateTime startDateTime, LocalDateTime endDateTime) {
        log.info("Fetching booked vehicle IDs for time range: {} to {}", startDateTime, endDateTime);
        
        // Get all bookings that overlap with the requested time range
        // We need to find bookings where:
        // - Booking status is CONFIRMED or ONGOING
        // - Booking time overlaps with requested range
        List<Booking> bookings = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.ONGOING)
                .filter(b -> b.getStartDateTime().isBefore(endDateTime) && b.getEndDateTime().isAfter(startDateTime))
                .collect(Collectors.toList());
        
        // Extract unique vehicle IDs
        return bookings.stream()
                .map(Booking::getVehicleId)
                .distinct()
                .collect(Collectors.toList());
    }
    
    @Transactional
    public BookingResponse confirmBooking(Long id) {
        log.info("Confirming booking: {}", id);
        
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));
        
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BusinessException("Only pending bookings can be confirmed", "INVALID_STATUS");
        }
        
        booking.setStatus(BookingStatus.CONFIRMED);
        booking = bookingRepository.save(booking);
        
        // Publish booking confirmed event
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("bookingId", booking.getId());
        eventData.put("bookingNumber", booking.getBookingNumber());
        eventPublisher.publishBookingEvent("confirmed", eventData);
        
        log.info("Booking confirmed successfully: {}", id);
        
        return mapToResponse(booking);
    }
    
    @Transactional
    public BookingResponse startBooking(Long id) {
        log.info("Starting booking: {}", id);
        
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));
        
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BusinessException("Only confirmed bookings can be started", "INVALID_STATUS");
        }
        
        booking.setStatus(BookingStatus.ONGOING);
        booking.setActualStartDateTime(LocalDateTime.now());
        booking = bookingRepository.save(booking);
        
        // Update vehicle status
        try {
            vehicleClient.updateVehicleStatus(booking.getVehicleId(), VehicleStatus.IN_USE);
        } catch (Exception e) {
            log.error("Failed to update vehicle status", e);
        }
        
        log.info("Booking started successfully: {}", id);
        
        return mapToResponse(booking);
    }
    
    @Transactional
    public BookingResponse completeBooking(Long id) {
        log.info("Completing booking: {}", id);
        
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));
        
        if (booking.getStatus() != BookingStatus.ONGOING) {
            throw new BusinessException("Only ongoing bookings can be completed", "INVALID_STATUS");
        }
        
        booking.setStatus(BookingStatus.COMPLETED);
        booking.setActualEndDateTime(LocalDateTime.now());
        booking = bookingRepository.save(booking);
        
        // Update vehicle status
        try {
            vehicleClient.updateVehicleStatus(booking.getVehicleId(), VehicleStatus.AVAILABLE);
        } catch (Exception e) {
            log.error("Failed to update vehicle status", e);
        }
        
        // Publish booking completed event
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("bookingId", booking.getId());
        eventData.put("bookingNumber", booking.getBookingNumber());
        eventPublisher.publishBookingEvent("completed", eventData);
        
        log.info("Booking completed successfully: {}", id);
        
        return mapToResponse(booking);
    }
    
    /**
     * Process expired bookings: auto-complete ONGOING past end time and release vehicles
     * for CONFIRMED bookings that ended without being started. Called by scheduler.
     */
    public void processExpiredBookings() {
        LocalDateTime now = LocalDateTime.now();
        for (Booking b : bookingRepository.findBookingsToComplete(now)) {
            try {
                completeExpiredOngoingBooking(b.getId());
            } catch (Exception e) {
                log.error("Failed to auto-complete booking {}", b.getId(), e);
            }
        }
        for (Booking b : bookingRepository.findExpiredConfirmedBookings(now)) {
            try {
                expireConfirmedBooking(b.getId());
            } catch (Exception e) {
                log.error("Failed to process expired confirmed booking {}", b.getId(), e);
            }
        }
        for (Booking b : bookingRepository.findExpiredPendingBookings(now)) {
            try {
                expirePendingBooking(b.getId());
            } catch (Exception e) {
                log.error("Failed to expire pending booking {}", b.getId(), e);
            }
        }
    }
    
    @Transactional
    public void completeExpiredOngoingBooking(Long id) {
        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null || booking.getStatus() != BookingStatus.ONGOING) return;
        booking.setStatus(BookingStatus.COMPLETED);
        booking.setActualEndDateTime(LocalDateTime.now());
        booking = bookingRepository.save(booking);
        try {
            vehicleClient.updateVehicleStatus(booking.getVehicleId(), VehicleStatus.AVAILABLE);
        } catch (Exception e) {
            log.error("Failed to update vehicle status for booking {}", id, e);
        }
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("bookingId", booking.getId());
        eventData.put("bookingNumber", booking.getBookingNumber());
        eventPublisher.publishBookingEvent("completed", eventData);
        log.info("Auto-completed expired booking: {}", id);
    }

    @Transactional
    public void expireConfirmedBooking(Long id) {
        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null || booking.getStatus() != BookingStatus.CONFIRMED) return;
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationReason("Expired - rental period ended without start");
        booking.setCancelledAt(LocalDateTime.now());
        booking = bookingRepository.save(booking);
        try {
            vehicleClient.updateVehicleStatus(booking.getVehicleId(), VehicleStatus.AVAILABLE);
        } catch (Exception e) {
            log.error("Failed to update vehicle status for booking {}", id, e);
        }
        log.info("Expired confirmed booking and released vehicle: {}", id);
    }
    
    @Transactional
    public void expirePendingBooking(Long id) {
        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null || booking.getStatus() != BookingStatus.PENDING) return;
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationReason("Expired - rental period ended");
        booking.setCancelledAt(LocalDateTime.now());
        booking = bookingRepository.save(booking);
        try {
            vehicleClient.updateVehicleStatus(booking.getVehicleId(), VehicleStatus.AVAILABLE);
        } catch (Exception e) {
            log.error("Failed to update vehicle status for booking {}", id, e);
        }
        log.info("Expired pending booking and released vehicle: {}", id);
    }
    
    /**
     * Correct a CANCELLED booking to COMPLETED when it was paid and the rental period has ended.
     * Use for fixing bookings that were wrongly auto-cancelled by processExpiredBookings.
     */
    @Transactional
    public BookingResponse correctPaidExpiredBookingToCompleted(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));
        if (booking.getStatus() != BookingStatus.CANCELLED) {
            throw new BusinessException("Only cancelled bookings can be corrected to completed", "INVALID_STATUS");
        }
        if (!Boolean.TRUE.equals(booking.getPaymentCompleted())) {
            throw new BusinessException("Only paid bookings can be corrected to completed", "BOOKING_NOT_PAID");
        }
        if (booking.getEndDateTime().isAfter(LocalDateTime.now())) {
            throw new BusinessException("Rental period has not ended yet", "RENTAL_NOT_ENDED");
        }
        booking.setStatus(BookingStatus.COMPLETED);
        booking.setActualStartDateTime(booking.getStartDateTime());
        booking.setActualEndDateTime(booking.getEndDateTime());
        booking.setCancellationReason(null);
        booking.setCancelledAt(null);
        booking = bookingRepository.save(booking);
        try {
            vehicleClient.updateVehicleStatus(booking.getVehicleId(), VehicleStatus.AVAILABLE);
        } catch (Exception e) {
            log.error("Failed to update vehicle status for booking {}", id, e);
        }
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("bookingId", booking.getId());
        eventData.put("bookingNumber", booking.getBookingNumber());
        eventPublisher.publishBookingEvent("completed", eventData);
        log.info("Corrected cancelled paid booking to completed: {}", id);
        return mapToResponse(booking);
    }

    @Transactional
    public BookingResponse cancelBooking(Long id, String reason) {
        log.info("Cancelling booking: {}", id);
        
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));
        
        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BusinessException("Cannot cancel completed or already cancelled bookings", "INVALID_STATUS");
        }
        
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationReason(reason);
        booking.setCancelledAt(LocalDateTime.now());
        booking = bookingRepository.save(booking);
        
        // Update vehicle status
        try {
            vehicleClient.updateVehicleStatus(booking.getVehicleId(), VehicleStatus.AVAILABLE);
        } catch (Exception e) {
            log.error("Failed to update vehicle status", e);
        }
        
        // Publish booking cancelled event
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("bookingId", booking.getId());
        eventData.put("bookingNumber", booking.getBookingNumber());
        eventData.put("reason", reason);
        eventPublisher.publishBookingEvent("cancelled", eventData);
        
        log.info("Booking cancelled successfully: {}", id);
        
        return mapToResponse(booking);
    }
    
    private BigDecimal calculatePrice(BookingRequest request) {
        // Simplified price calculation - should integrate with pricing service
        long hours = Duration.between(request.getStartDateTime(), request.getEndDateTime()).toHours();
        BigDecimal basePrice = BigDecimal.valueOf(hours * 10); // $10 per hour
        
        if (request.getWithDriver()) {
            basePrice = basePrice.add(BigDecimal.valueOf(hours * 5)); // Additional $5 per hour for driver
        }
        
        return basePrice;
    }
    
    private String generateBookingNumber() {
        return "BK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    
    private BookingResponse mapToResponse(Booking booking) {
        BookingResponse response = new BookingResponse();
        response.setId(booking.getId());
        response.setBookingNumber(booking.getBookingNumber());
        response.setUserId(booking.getUserId());
        response.setVehicleId(booking.getVehicleId());
        response.setDriverId(booking.getDriverId());
        response.setStatus(booking.getStatus());
        response.setStartDateTime(booking.getStartDateTime());
        response.setEndDateTime(booking.getEndDateTime());
        response.setActualStartDateTime(booking.getActualStartDateTime());
        response.setActualEndDateTime(booking.getActualEndDateTime());
        response.setPickupLocation(booking.getPickupLocation());
        response.setPickupLatitude(booking.getPickupLatitude());
        response.setPickupLongitude(booking.getPickupLongitude());
        response.setDropoffLocation(booking.getDropoffLocation());
        response.setDropoffLatitude(booking.getDropoffLatitude());
        response.setDropoffLongitude(booking.getDropoffLongitude());
        response.setWithDriver(booking.getWithDriver());
        response.setVehiclePrice(booking.getVehiclePrice());
        response.setDriverPrice(booking.getDriverPrice());
        response.setTotalPrice(booking.getTotalPrice());
        response.setDiscountAmount(booking.getDiscountAmount());
        response.setFinalPrice(booking.getFinalPrice());
        response.setPaymentId(booking.getPaymentId());
        response.setPaymentCompleted(booking.getPaymentCompleted());
        response.setCancellationReason(booking.getCancellationReason());
        response.setCancelledAt(booking.getCancelledAt());
        response.setDistanceKm(booking.getDistanceKm());
        response.setSpecialRequests(booking.getSpecialRequests());
        response.setNotes(booking.getNotes());
        response.setCreatedAt(booking.getCreatedAt());
        response.setUpdatedAt(booking.getUpdatedAt());
        
        // Fetch user (renter) information
        try {
            ApiResponse<Object> userResponse = userClient.getUserById(booking.getUserId());
            if (userResponse != null && userResponse.getData() != null) {
                Map<String, Object> userData = objectMapper.convertValue(userResponse.getData(), Map.class);
                response.setUserFirstName((String) userData.get("firstName"));
                response.setUserLastName((String) userData.get("lastName"));
                response.setUserPhoneNumber((String) userData.get("phoneNumber"));
                response.setUserEmail((String) userData.get("email"));
            }
        } catch (Exception e) {
            log.warn("Failed to fetch user information for booking {}: {}", booking.getId(), e.getMessage());
            // Don't fail the request if user info can't be fetched
        }
        
        // Fetch owner information for confirmed bookings
        if (booking.getStatus() == BookingStatus.CONFIRMED || 
            booking.getStatus() == BookingStatus.ONGOING || 
            booking.getStatus() == BookingStatus.COMPLETED) {
            try {
                // Get vehicle to find owner ID
                ApiResponse<Object> vehicleResponse = vehicleClient.getVehicleById(booking.getVehicleId());
                if (vehicleResponse != null && vehicleResponse.getData() != null) {
                    Map<String, Object> vehicleData = objectMapper.convertValue(vehicleResponse.getData(), Map.class);
                    Long ownerId = vehicleData.get("ownerId") != null ? 
                        Long.valueOf(vehicleData.get("ownerId").toString()) : null;
                    
                    if (ownerId != null) {
                        // Get owner information
                        ApiResponse<Object> userResponse = userClient.getUserById(ownerId);
                        if (userResponse != null && userResponse.getData() != null) {
                            Map<String, Object> userData = objectMapper.convertValue(userResponse.getData(), Map.class);
                            response.setOwnerFirstName((String) userData.get("firstName"));
                            response.setOwnerLastName((String) userData.get("lastName"));
                            response.setOwnerPhoneNumber((String) userData.get("phoneNumber"));
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to fetch owner information for booking {}: {}", booking.getId(), e.getMessage());
                // Don't fail the request if owner info can't be fetched
            }
        }
        
        return response;
    }
}






