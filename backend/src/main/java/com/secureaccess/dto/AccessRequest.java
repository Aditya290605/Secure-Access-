package com.secureaccess.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AccessRequest(
        @NotNull(message = "Resource ID is required")
        UUID resourceId,

        @NotNull(message = "Action is required")
        String action
) {}
