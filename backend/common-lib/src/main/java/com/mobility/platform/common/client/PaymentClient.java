package com.mobility.platform.common.client;

import com.mobility.platform.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

/**
 * Feign Client for Payment Gateway Service (Black Box)
 * 
 * This is an interface to your existing payment gateway.
 * The payment service should be registered with Eureka or accessed directly via URL.
 */
@FeignClient(name = "payment-service", path = "/api/payments")
public interface PaymentClient {
    
    /**
     * Create a payment transaction
     * 
     * @param request Payment transaction request
     * @return Transaction details with transaction ID
     */
    @PostMapping("/transaction/create")
    ApiResponse<TransactionResponse> createTransaction(@RequestBody TransactionRequest request);
    
    /**
     * Verify a payment transaction
     * 
     * @param transactionId Transaction ID to verify
     * @return Verification result with transaction status
     */
    @PostMapping("/transaction/verify")
    ApiResponse<TransactionResponse> verifyTransaction(@RequestParam String transactionId);
    
    // DTOs for Payment Gateway Integration
    
    class TransactionRequest {
        private Long userId;
        private Long bookingId;
        private BigDecimal amount;
        private String currency;
        private String description;
        private String callbackUrl;
        
        // Getters and Setters
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        
        public Long getBookingId() { return bookingId; }
        public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
        
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public String getCallbackUrl() { return callbackUrl; }
        public void setCallbackUrl(String callbackUrl) { this.callbackUrl = callbackUrl; }
    }
    
    class TransactionResponse {
        private String transactionId;
        private String status; // PENDING, COMPLETED, FAILED, CANCELLED
        private BigDecimal amount;
        private String currency;
        private String paymentUrl; // URL to redirect user for payment
        private String message;
        private Long timestamp;
        
        // Getters and Setters
        public String getTransactionId() { return transactionId; }
        public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        
        public String getPaymentUrl() { return paymentUrl; }
        public void setPaymentUrl(String paymentUrl) { this.paymentUrl = paymentUrl; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public Long getTimestamp() { return timestamp; }
        public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }
    }
}
