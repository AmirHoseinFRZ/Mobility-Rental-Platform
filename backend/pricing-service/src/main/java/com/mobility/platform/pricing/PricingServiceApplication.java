package com.mobility.platform.pricing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(scanBasePackages = {
        "com.mobility.platform.pricing",
        "com.mobility.platform.common"
})
@EnableDiscoveryClient
@EnableJpaAuditing
public class PricingServiceApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(PricingServiceApplication.class, args);
    }
}





