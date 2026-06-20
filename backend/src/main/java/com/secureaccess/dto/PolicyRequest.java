package com.secureaccess.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record PolicyRequest(
        @NotNull(message = "Role is required")
        String role,

        @NotNull(message = "Resource ID is required")
        UUID resourceId,

        @NotNull(message = "Permission is required")
        String permission,

        String conditionExpression
) {}
