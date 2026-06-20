package com.secureaccess.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ResourceRequest(
        @NotBlank(message = "Resource name is required")
        String name,

        String description,

        @NotBlank(message = "Owner is required")
        String owner,

        @NotNull(message = "Sensitivity level is required")
        String sensitivityLevel
) {}
