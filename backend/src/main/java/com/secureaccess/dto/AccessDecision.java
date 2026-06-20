package com.secureaccess.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * The result of evaluating an access request through the policy engine.
 * Always includes a human-readable reason explaining the decision.
 */
public record AccessDecision(
        boolean allowed,
        String decision,
        String reason,
        UUID userId,
        String userEmail,
        UUID resourceId,
        String resourceName,
        String action,
        Instant evaluatedAt
) {
    public static AccessDecision allow(String reason, UUID userId, String userEmail,
                                       UUID resourceId, String resourceName, String action) {
        return new AccessDecision(true, "ALLOWED", reason, userId, userEmail,
                resourceId, resourceName, action, Instant.now());
    }

    public static AccessDecision deny(String reason, UUID userId, String userEmail,
                                      UUID resourceId, String resourceName, String action) {
        return new AccessDecision(false, "DENIED", reason, userId, userEmail,
                resourceId, resourceName, action, Instant.now());
    }
}
