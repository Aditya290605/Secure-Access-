package com.secureaccess.event;

import com.secureaccess.domain.Action;
import com.secureaccess.domain.AuditLog;
import com.secureaccess.dto.AccessDecision;
import com.secureaccess.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Listens for AccessDecisionEvents and persists them as audit log entries.
 *
 * Key design decisions:
 *   - @Async: audit persistence doesn't block the access-check response.
 *     In production, this uses a thread pool; the caller gets their decision
 *     immediately while the audit write happens in the background.
 *   - @EventListener (not @TransactionalEventListener): we want to log ALL
 *     decisions including denied ones, regardless of transaction outcome.
 */
@Component
public class AuditEventListener {

    private static final Logger log = LoggerFactory.getLogger(AuditEventListener.class);

    private final AuditLogRepository auditLogRepository;

    public AuditEventListener(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Async
    @EventListener
    public void onAccessDecision(AccessDecisionEvent event) {
        AccessDecision decision = event.decision();

        try {
            AuditLog entry = new AuditLog(
                    decision.userId(),
                    decision.userEmail(),
                    decision.resourceId(),
                    decision.resourceName(),
                    Action.valueOf(decision.action()),
                    decision.decision(),
                    decision.reason(),
                    event.ipAddress()
            );
            auditLogRepository.save(entry);
            log.debug("Audit logged: {} {} {} → {}",
                    decision.userEmail(), decision.action(),
                    decision.resourceName(), decision.decision());
        } catch (Exception e) {
            // Audit failure must never break the access check flow
            log.error("Failed to persist audit log: {}", e.getMessage(), e);
        }
    }
}
