package com.secureaccess.dto;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        UUID userId,
        String userEmail,
        UUID resourceId,
        String resourceName,
        String action,
        String decision,
        String reason,
        Instant timestamp,
        String ipAddress
) {}
