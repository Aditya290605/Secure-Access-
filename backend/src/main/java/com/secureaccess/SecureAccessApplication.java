package com.secureaccess;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SecureAccessApplication {

    public static void main(String[] args) {
        SpringApplication.run(SecureAccessApplication.class, args);
    }
}
