package com.secureaccess.dto;

import java.time.Instant;
import java.util.UUID;

public record PolicyResponse(
        UUID id,
        String role,
        UUID resourceId,
        String resourceName,
        String permission,
        String conditionExpression,
        Instant createdAt,
        Instant updatedAt
) {}
