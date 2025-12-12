package com.mobility.platform.maintenance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(scanBasePackages = {
        "com.mobility.platform.maintenance",
        "com.mobility.platform.common"
})
@EnableDiscoveryClient
@EnableJpaAuditing
public class MaintenanceServiceApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(MaintenanceServiceApplication.class, args);
    }
}






