package com.mobility.platform.booking.client;

import com.mobility.platform.booking.dto.PaymentLinkResponse;
import com.mobility.platform.booking.dto.PaymentTransactionRequest;
import com.mobility.platform.booking.dto.PaymentTransactionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import lombok.extern.slf4j.Slf4j;

import java.net.URL;
import java.util.HashMap;
import java.util.Map;

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
        
        // Map PaymentTransactionRequest to payment gateway's expected format
        // Payment gateway expects: clientCallbackURL (not callbackUrl)
        Map<String, Object> gatewayRequest = new HashMap<>();
        gatewayRequest.put("amount", request.getAmount());
        gatewayRequest.put("invoiceId", request.getInvoiceId());
        gatewayRequest.put("mobileNumber", request.getMobileNumber());
        gatewayRequest.put("email", request.getEmail());
        gatewayRequest.put("description", request.getDescription());
        
        // Convert callbackUrl to clientCallbackURL (URL type)
        try {
            if (request.getCallbackUrl() != null && !request.getCallbackUrl().isEmpty()) {
                URL callbackUrl = new URL(request.getCallbackUrl());
                gatewayRequest.put("clientCallbackURL", callbackUrl.toString());
            }
        } catch (Exception e) {
            log.error("Invalid callback URL: {}", request.getCallbackUrl(), e);
            throw new RuntimeException("Invalid callback URL: " + request.getCallbackUrl(), e);
        }
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(gatewayRequest, headers);
        
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
            // Payment gateway returns InquiryTransactionResponseDTO with transactionStatus (enum)
            // We need to map it to PaymentTransactionResponse with status (String)
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                gatewayUrl + "/inquiry/" + transactionId,
                HttpMethod.GET,
                entity,
                new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null) {
                throw new RuntimeException("Empty response from payment gateway");
            }
            
            // Map the response
            PaymentTransactionResponse.PaymentTransactionResponseBuilder builder = PaymentTransactionResponse.builder();
            
            // Map transactionId (UUID to String)
            if (responseBody.get("transactionId") != null) {
                builder.transactionId(responseBody.get("transactionId").toString());
            }
            
            // Map invoiceId
            if (responseBody.get("invoiceId") != null) {
                builder.invoiceId(responseBody.get("invoiceId").toString());
            }
            
            // Map transactionStatus (enum) to status (String)
            Object transactionStatusObj = responseBody.get("transactionStatus");
            if (transactionStatusObj != null) {
                String statusStr;
                // Handle enum - could be serialized as string or object
                if (transactionStatusObj instanceof Map) {
                    // If it's an object, try to get the name
                    Map<?, ?> statusMap = (Map<?, ?>) transactionStatusObj;
                    statusStr = statusMap.get("name") != null ? 
                        statusMap.get("name").toString() : transactionStatusObj.toString();
                } else {
                    // Usually enum is serialized as the enum name (e.g., "SUCCESS")
                    statusStr = transactionStatusObj.toString();
                }
                builder.status(statusStr);
            } else {
                log.warn("Transaction status not found in response for transaction: {}", transactionId);
            }
            
            // Map gatewayTraceNumber if available
            if (responseBody.get("gatewayTraceNumber") != null) {
                // Could store in a separate field if needed
            }
            
            // Map verifiedAt if available
            if (responseBody.get("verifiedAt") != null) {
                // Could map to updatedAt if needed
            }
            
            PaymentTransactionResponse result = builder.build();
            log.info("Transaction inquiry successful: {}", result);
            return result;
        } catch (Exception e) {
            log.error("Error inquiring transaction", e);
            throw new RuntimeException("Failed to inquire transaction: " + e.getMessage(), e);
        }
    }
}

