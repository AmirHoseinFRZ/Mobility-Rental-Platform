package com.mobility.platform.booking.controller;

import com.mobility.platform.booking.dto.PaymentLinkResponse;
import com.mobility.platform.booking.dto.PaymentTransactionRequest;
import com.mobility.platform.booking.dto.PaymentTransactionResponse;
import com.mobility.platform.booking.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for payment-related operations
 */
@Slf4j
@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Tag(name = "Payment", description = "Payment management API")
public class PaymentController {
    
    private final PaymentService paymentService;
    
    @PostMapping("/transaction/create")
    @Operation(summary = "Create a payment transaction", description = "Creates a new payment transaction for a booking")
    public ResponseEntity<PaymentTransactionResponse> createTransaction(
            @Valid @RequestBody PaymentTransactionRequest request) {
        log.info("Creating payment transaction for booking: {}", request.getInvoiceId());
        PaymentTransactionResponse response = paymentService.createTransaction(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @PostMapping("/transaction/{transactionId}/pay")
    @Operation(summary = "Get payment link", description = "Gets the payment link for completing the transaction")
    public ResponseEntity<PaymentLinkResponse> getPaymentLink(
            @PathVariable String transactionId) {
        log.info("Getting payment link for transaction: {}", transactionId);
        PaymentLinkResponse response = paymentService.getPaymentLink(transactionId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/transaction/{transactionId}/status")
    @Operation(summary = "Get transaction status", description = "Retrieves the current status of a payment transaction")
    public ResponseEntity<PaymentTransactionResponse> getTransactionStatus(
            @PathVariable String transactionId) {
        log.info("Getting transaction status: {}", transactionId);
        PaymentTransactionResponse response = paymentService.inquireTransaction(transactionId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/transaction/booking/{bookingId}")
    @Operation(summary = "Get payment by booking ID", description = "Retrieves payment transaction for a booking")
    public ResponseEntity<PaymentTransactionResponse> getPaymentByBookingId(
            @PathVariable Long bookingId) {
        log.info("Getting payment for booking: {}", bookingId);
        PaymentTransactionResponse response = paymentService.getPaymentByBookingId(bookingId);
        return ResponseEntity.ok(response);
    }
}

