package com.mobility.platform.common.client;

import com.mobility.platform.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

/**
 * Feign client for existing Payment Service (external/already implemented)
 * This is a black box interface - actual implementation exists separately
 */
@FeignClient(name = "payment-service", path = "/api/payments")
public interface PaymentClient {
    
    /**
     * Create a new payment transaction
     * @param request Payment request details
     * @return Payment response with transaction ID
     */
    @PostMapping("/create")
    ApiResponse<PaymentResponse> createPayment(@RequestBody PaymentRequest request);
    
    /**
     * Get payment status by transaction ID
     * @param transactionId Transaction ID
     * @return Payment details
     */
    @GetMapping("/{transactionId}")
    ApiResponse<PaymentResponse> getPaymentStatus(@PathVariable("transactionId") String transactionId);
    
    /**
     * Process payment
     * @param transactionId Transaction ID
     * @return Updated payment status
     */
    @PostMapping("/{transactionId}/process")
    ApiResponse<PaymentResponse> processPayment(@PathVariable("transactionId") String transactionId);
    
    /**
     * Refund payment
     * @param transactionId Transaction ID
     * @param amount Refund amount
     * @return Refund status
     */
    @PostMapping("/{transactionId}/refund")
    ApiResponse<PaymentResponse> refundPayment(
            @PathVariable("transactionId") String transactionId,
            @RequestParam("amount") BigDecimal amount);
    
    /**
     * Payment request DTO
     */
    class PaymentRequest {
        private Long userId;
        private Long bookingId;
        private BigDecimal amount;
        private String currency;
        private String paymentMethod; // CREDIT_CARD, DEBIT_CARD, WALLET, etc.
        private String description;
        
        // Getters and setters
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        
        public Long getBookingId() { return bookingId; }
        public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
        
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
    
    /**
     * Payment response DTO
     */
    class PaymentResponse {
        private String transactionId;
        private Long userId;
        private Long bookingId;
        private BigDecimal amount;
        private String currency;
        private String status; // PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED
        private String paymentMethod;
        private String gatewayResponse;
        private java.time.LocalDateTime createdAt;
        private java.time.LocalDateTime completedAt;
        
        // Getters and setters
        public String getTransactionId() { return transactionId; }
        public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
        
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        
        public Long getBookingId() { return bookingId; }
        public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
        
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
        
        public String getGatewayResponse() { return gatewayResponse; }
        public void setGatewayResponse(String gatewayResponse) { this.gatewayResponse = gatewayResponse; }
        
        public java.time.LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(java.time.LocalDateTime createdAt) { this.createdAt = createdAt; }
        
        public java.time.LocalDateTime getCompletedAt() { return completedAt; }
        public void setCompletedAt(java.time.LocalDateTime completedAt) { this.completedAt = completedAt; }
    }
}

