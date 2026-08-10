package com.ledger.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI eventSourcedLedgerOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Event-Sourced Ledger API")
                        .version("v0.1")
                        .description("A production-grade event-sourced financial ledger API."));
    }
}