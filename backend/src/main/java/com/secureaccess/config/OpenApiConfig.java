package com.secureaccess.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI configuration — adds JWT bearer auth scheme to Swagger UI
 * and sets project metadata.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI secureAccessOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("SecureAccess API")
                        .description("Role-Based Data Access Governance Platform — "
                                + "Policy engine with explainable access decisions and full audit trail.")
                        .version("0.1.0")
                        .contact(new Contact()
                                .name("SecureAccess Team")
                                .email("admin@secureaccess.io")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Paste your JWT token from /api/auth/login")));
    }
}
