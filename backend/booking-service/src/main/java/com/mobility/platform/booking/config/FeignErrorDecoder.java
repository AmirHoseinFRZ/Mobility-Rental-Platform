package com.mobility.platform.booking.config;

import feign.Response;
import feign.codec.ErrorDecoder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class FeignErrorDecoder implements ErrorDecoder {
    
    private final ErrorDecoder defaultErrorDecoder = new Default();
    
    @Override
    public Exception decode(String methodKey, Response response) {
        log.warn("Feign error occurred: method={}, status={}, reason={}", 
                methodKey, response.status(), response.reason());
        
        // Log headers for debugging
        response.headers().forEach((key, values) -> 
            log.debug("Response header: {}={}", key, values));
        
        return defaultErrorDecoder.decode(methodKey, response);
    }
}

