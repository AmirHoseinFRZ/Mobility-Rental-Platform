package com.mobility.platform.review;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(scanBasePackages = {
        "com.mobility.platform.review",
        "com.mobility.platform.common"
})
@EnableDiscoveryClient
@EnableFeignClients(basePackages = "com.mobility.platform.review.client")
@EnableJpaAuditing
public class ReviewServiceApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(ReviewServiceApplication.class, args);
    }
}

