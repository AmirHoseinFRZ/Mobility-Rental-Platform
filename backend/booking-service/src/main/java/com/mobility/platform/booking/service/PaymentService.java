package com.mobility.platform.booking.service;

import com.mobility.platform.booking.client.PaymentGatewayClient;
import com.mobility.platform.booking.dto.PaymentLinkResponse;
import com.mobility.platform.booking.dto.PaymentTransactionRequest;
import com.mobility.platform.booking.dto.PaymentTransactionResponse;
import com.mobility.platform.booking.entity.Booking;
import com.mobility.platform.booking.repository.BookingRepository;
import com.mobility.platform.common.enums.BookingStatus;
import com.mobility.platform.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for handling payment operations
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {
    
    private final PaymentGatewayClient paymentGatewayClient;
    private final BookingRepository bookingRepository;
    
    /**
     * Create a payment transaction
     */
    @Transactional
    public PaymentTransactionResponse createTransaction(PaymentTransactionRequest request) {
        log.info("Creating payment transaction: {}", request);
        PaymentTransactionResponse response = paymentGatewayClient.createTransaction(request);
        
        // Store transactionId in booking if invoiceId is a booking reference
        if (request.getInvoiceId() != null && request.getInvoiceId().startsWith("BOOKING-")) {
            String bookingNumber = request.getInvoiceId().substring(8); // Remove "BOOKING-" prefix
            bookingRepository.findByBookingNumber(bookingNumber)
                    .ifPresent(booking -> {
                        booking.setPaymentTransactionId(response.getTransactionId());
                        bookingRepository.save(booking);
                        log.info("Stored transactionId {} for booking {}", response.getTransactionId(), bookingNumber);
                    });
        }
        
        return response;
    }
    
    /**
     * Get payment link for a transaction
     */
    public PaymentLinkResponse getPaymentLink(String transactionId) {
        log.info("Getting payment link for transaction: {}", transactionId);
        return paymentGatewayClient.getPaymentLink(transactionId);
    }
    
    /**
     * Inquire transaction status
     */
    public PaymentTransactionResponse inquireTransaction(String transactionId) {
        log.info("Inquiring transaction status: {}", transactionId);
        return paymentGatewayClient.inquireTransaction(transactionId);
    }
    
    /**
     * Get payment transaction by booking ID
     */
    public PaymentTransactionResponse getPaymentByBookingId(Long bookingId) {
        log.info("Getting payment for booking: {}", bookingId);
        
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));
        
        // The invoice ID is the booking number
        String invoiceId = "BOOKING-" + booking.getBookingNumber();
        
        // We would need to store the transaction ID with the booking to retrieve it
        // For now, we'll return a placeholder response
        return PaymentTransactionResponse.builder()
                .invoiceId(invoiceId)
                .amount(booking.getTotalPrice().multiply(new java.math.BigDecimal(100)).longValue())
                .status("PENDING")
                .build();
    }
    
    /**
     * Verify payment transaction and update booking status
     * This method is idempotent - multiple calls with the same result won't cause errors
     */
    @Transactional
    public PaymentTransactionResponse verifyTransaction(String transactionId) {
        log.info("Verifying payment transaction: {}", transactionId);
        
        // Find booking by transaction ID
        Booking booking = bookingRepository.findByPaymentTransactionId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "paymentTransactionId", transactionId));
        
        // Inquire transaction status from payment gateway
        PaymentTransactionResponse transactionResponse = paymentGatewayClient.inquireTransaction(transactionId);
        
        // Update booking based on payment status
        String paymentStatus = transactionResponse.getStatus();
        if ("SUCCESS".equalsIgnoreCase(paymentStatus) || "COMPLETED".equalsIgnoreCase(paymentStatus)) {
            // Check if booking is already confirmed (idempotent operation)
            if (booking.getStatus() == BookingStatus.CONFIRMED && booking.getPaymentCompleted()) {
                log.info("Booking {} is already confirmed, skipping update", booking.getId());
            } else if (booking.getStatus() == BookingStatus.PENDING) {
                // Only update if still pending
                booking.setStatus(BookingStatus.CONFIRMED);
                booking.setPaymentCompleted(true);
                try {
                    bookingRepository.save(booking);
                    log.info("Booking {} confirmed after successful payment verification", booking.getId());
                } catch (org.springframework.orm.ObjectOptimisticLockingFailureException e) {
                    // Booking was updated by another transaction, refresh and check status
                    log.warn("Concurrent update detected for booking {}, refreshing state", booking.getId());
                    Booking refreshedBooking = bookingRepository.findById(booking.getId())
                            .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", booking.getId()));
                    
                    // If already confirmed, that's fine (idempotent)
                    if (refreshedBooking.getStatus() == BookingStatus.CONFIRMED && refreshedBooking.getPaymentCompleted()) {
                        log.info("Booking {} was confirmed by another transaction", booking.getId());
                    } else {
                        // Re-throw if not yet confirmed - something else is wrong
                        throw e;
                    }
                }
            } else {
                log.info("Booking {} is in status {}, not updating", booking.getId(), booking.getStatus());
            }
        } else if ("FAILED".equalsIgnoreCase(paymentStatus) || "CANCELED".equalsIgnoreCase(paymentStatus)) {
            // Keep booking as PENDING if payment failed
            log.warn("Payment verification failed for booking {}: {}", booking.getId(), paymentStatus);
        }
        
        return transactionResponse;
    }
}

