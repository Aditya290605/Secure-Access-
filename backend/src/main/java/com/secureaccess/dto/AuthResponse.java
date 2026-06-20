package com.secureaccess.dto;

import java.util.Set;
import java.util.UUID;

public record AuthResponse(
        String token,
        UUID userId,
        String email,
        Set<String> roles
) {}
