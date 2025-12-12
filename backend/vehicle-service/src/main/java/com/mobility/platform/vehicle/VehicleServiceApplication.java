package com.mobility.platform.vehicle;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(scanBasePackages = {
        "com.mobility.platform.vehicle",
        "com.mobility.platform.common"
})
@EnableDiscoveryClient
@EnableJpaAuditing
public class VehicleServiceApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(VehicleServiceApplication.class, args);
    }
}


