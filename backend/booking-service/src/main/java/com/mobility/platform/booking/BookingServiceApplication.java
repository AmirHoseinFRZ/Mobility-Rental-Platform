package com.mobility.platform.booking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(scanBasePackages = {
        "com.mobility.platform.booking",
        "com.mobility.platform.common"
})
@EnableDiscoveryClient
@EnableFeignClients
@EnableJpaAuditing
public class BookingServiceApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(BookingServiceApplication.class, args);
    }
}


