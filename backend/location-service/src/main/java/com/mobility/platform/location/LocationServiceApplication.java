package com.mobility.platform.location;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(scanBasePackages = {
        "com.mobility.platform.location",
        "com.mobility.platform.common"
})
@EnableDiscoveryClient
@EnableJpaAuditing
public class LocationServiceApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(LocationServiceApplication.class, args);
    }
}

