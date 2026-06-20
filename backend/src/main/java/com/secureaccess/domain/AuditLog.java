package com.secureaccess.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Immutable audit record of every access evaluation.
 * No setters — once created, an audit log entry is never modified.
 *
 * Captures:
 *   - Who requested access (userId, userEmail)
 *   - What resource and action
 *   - The decision (ALLOWED/DENIED) and the reason explaining it
 *   - When it happened and from what IP
 */
@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_user_id", columnList = "userId"),
        @Index(name = "idx_audit_resource_id", columnList = "resourceId"),
        @Index(name = "idx_audit_decision", columnList = "decision"),
        @Index(name = "idx_audit_timestamp", columnList = "timestamp")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private UUID resourceId;

    @Column(nullable = false)
    private String resourceName;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Action action;

    @Column(nullable = false)
    private String decision;

    @Column(nullable = false, length = 1024)
    private String reason;

    @Column(nullable = false)
    private Instant timestamp;

    private String ipAddress;

    protected AuditLog() {
        // JPA
    }

    public AuditLog(UUID userId, String userEmail, UUID resourceId, String resourceName,
                    Action action, String decision, String reason, String ipAddress) {
        this.userId = userId;
        this.userEmail = userEmail;
        this.resourceId = resourceId;
        this.resourceName = resourceName;
        this.action = action;
        this.decision = decision;
        this.reason = reason;
        this.ipAddress = ipAddress;
        this.timestamp = Instant.now();
    }

    // --- Getters only (immutable) ---

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getUserEmail() { return userEmail; }
    public UUID getResourceId() { return resourceId; }
    public String getResourceName() { return resourceName; }
    public Action getAction() { return action; }
    public String getDecision() { return decision; }
    public String getReason() { return reason; }
    public Instant getTimestamp() { return timestamp; }
    public String getIpAddress() { return ipAddress; }
}
