package com.mobility.platform.booking.service;

import com.mobility.platform.booking.client.PaymentGatewayClient;
import com.mobility.platform.booking.dto.PaymentLinkResponse;
import com.mobility.platform.booking.dto.PaymentTransactionRequest;
import com.mobility.platform.booking.dto.PaymentTransactionResponse;
import com.mobility.platform.booking.entity.Booking;
import com.mobility.platform.booking.repository.BookingRepository;
import com.mobility.platform.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

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
    public PaymentTransactionResponse createTransaction(PaymentTransactionRequest request) {
        log.info("Creating payment transaction: {}", request);
        return paymentGatewayClient.createTransaction(request);
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
}

