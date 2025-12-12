package com.mobility.platform.common.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

/**
 * Event publisher for RabbitMQ messaging
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EventPublisher {
    
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;
    
    private static final String EXCHANGE_NAME = "mobility.events";
    
    public void publishEvent(String routingKey, Object event) {
        try {
            log.info("Publishing event with routing key: {}", routingKey);
            rabbitTemplate.convertAndSend(EXCHANGE_NAME, routingKey, event);
            log.info("Event published successfully");
        } catch (Exception e) {
            log.error("Failed to publish event", e);
            throw new RuntimeException("Event publishing failed", e);
        }
    }
    
    public void publishBookingEvent(String eventType, Object event) {
        publishEvent("booking." + eventType, event);
    }
    
    public void publishPaymentEvent(String eventType, Object event) {
        publishEvent("payment." + eventType, event);
    }
    
    public void publishVehicleEvent(String eventType, Object event) {
        publishEvent("vehicle." + eventType, event);
    }
    
    public void publishDriverEvent(String eventType, Object event) {
        publishEvent("driver." + eventType, event);
    }
    
    public void publishUserEvent(String eventType, Object event) {
        publishEvent("user." + eventType, event);
    }
}






