package com.secureaccess.dto;

import java.time.Instant;
import java.util.UUID;

public record ResourceResponse(
        UUID id,
        String name,
        String description,
        String owner,
        String sensitivityLevel,
        Instant createdAt,
        Instant updatedAt
) {}
