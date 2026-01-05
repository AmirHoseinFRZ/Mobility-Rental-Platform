package com.mobility.platform.booking.client;

import com.mobility.platform.booking.dto.PaymentLinkResponse;
import com.mobility.platform.booking.dto.PaymentTransactionRequest;
import com.mobility.platform.booking.dto.PaymentTransactionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import lombok.extern.slf4j.Slf4j;

/**
 * Client for interacting with the internal payment gateway
 */
@Slf4j
@Component
public class PaymentGatewayClient {
    
    @Value("${payment.gateway.url}")
    private String gatewayUrl;
    
    @Value("${payment.gateway.token}")
    private String gatewayToken;
    
    private final RestTemplate restTemplate;
    
    public PaymentGatewayClient() {
        this.restTemplate = new RestTemplate();
    }
    
    /**
     * Create a new payment transaction
     */
    public PaymentTransactionResponse createTransaction(PaymentTransactionRequest request) {
        log.info("Creating payment transaction for invoice: {}", request.getInvoiceId());
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(gatewayToken);
        
        HttpEntity<PaymentTransactionRequest> entity = new HttpEntity<>(request, headers);
        
        try {
            ResponseEntity<PaymentTransactionResponse> response = restTemplate.exchange(
                gatewayUrl + "/new",
                HttpMethod.POST,
                entity,
                PaymentTransactionResponse.class
            );
            
            log.info("Payment transaction created successfully: {}", response.getBody());
            return response.getBody();
        } catch (Exception e) {
            log.error("Error creating payment transaction", e);
            throw new RuntimeException("Failed to create payment transaction: " + e.getMessage(), e);
        }
    }
    
    /**
     * Get payment link for a transaction
     */
    public PaymentLinkResponse getPaymentLink(String transactionId) {
        log.info("Getting payment link for transaction: {}", transactionId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        
        try {
            ResponseEntity<PaymentLinkResponse> response = restTemplate.exchange(
                gatewayUrl + "/pay/" + transactionId + "?gateway=sandbox",
                HttpMethod.POST,
                entity,
                PaymentLinkResponse.class
            );
            
            log.info("Payment link retrieved successfully: {}", response.getBody());
            return response.getBody();
        } catch (Exception e) {
            log.error("Error getting payment link", e);
            throw new RuntimeException("Failed to get payment link: " + e.getMessage(), e);
        }
    }
    
    /**
     * Inquire transaction status
     */
    public PaymentTransactionResponse inquireTransaction(String transactionId) {
        log.info("Inquiring transaction status: {}", transactionId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(gatewayToken);
        
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        
        try {
            ResponseEntity<PaymentTransactionResponse> response = restTemplate.exchange(
                gatewayUrl + "/inquiry/" + transactionId,
                HttpMethod.GET,
                entity,
                PaymentTransactionResponse.class
            );
            
            log.info("Transaction inquiry successful: {}", response.getBody());
            return response.getBody();
        } catch (Exception e) {
            log.error("Error inquiring transaction", e);
            throw new RuntimeException("Failed to inquire transaction: " + e.getMessage(), e);
        }
    }
}

