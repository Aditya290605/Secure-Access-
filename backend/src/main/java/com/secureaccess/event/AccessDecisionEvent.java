package com.secureaccess.event;

import com.secureaccess.dto.AccessDecision;

/**
 * Domain event fired every time the AccessEvaluator produces a decision.
 * Consumed by AuditEventListener to persist the audit trail asynchronously.
 *
 * Using Spring's ApplicationEventPublisher decouples the policy engine
 * from the audit persistence concern — the evaluator doesn't need to know
 * about the audit log at all.
 */
public record AccessDecisionEvent(
        AccessDecision decision,
        String ipAddress
) {}
