package com.secureaccess.event;

import com.secureaccess.domain.Action;
import com.secureaccess.domain.AuditLog;
import com.secureaccess.dto.AccessDecision;
import com.secureaccess.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the async audit event listener.
 * Verifies that access decisions are correctly persisted as audit log entries.
 */
@ExtendWith(MockitoExtension.class)
class AuditEventListenerTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    private AuditEventListener listener;

    @BeforeEach
    void setUp() {
        listener = new AuditEventListener(auditLogRepository);
    }

    @Test
    @DisplayName("ALLOWED decision is persisted with all fields")
    void allowedDecision_isPersisted() {
        UUID userId = UUID.randomUUID();
        UUID resourceId = UUID.randomUUID();
        AccessDecision decision = AccessDecision.allow(
                "Access granted by policy: role=VIEWER, permission=READ",
                userId, "viewer@test.com", resourceId, "customer_data", "READ");

        AccessDecisionEvent event = new AccessDecisionEvent(decision, "192.168.1.100");

        listener.onAccessDecision(event);

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());

        AuditLog saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo(userId);
        assertThat(saved.getUserEmail()).isEqualTo("viewer@test.com");
        assertThat(saved.getResourceId()).isEqualTo(resourceId);
        assertThat(saved.getResourceName()).isEqualTo("customer_data");
        assertThat(saved.getAction()).isEqualTo(Action.READ);
        assertThat(saved.getDecision()).isEqualTo("ALLOWED");
        assertThat(saved.getReason()).contains("Access granted");
        assertThat(saved.getIpAddress()).isEqualTo("192.168.1.100");
        assertThat(saved.getTimestamp()).isNotNull();
    }

    @Test
    @DisplayName("DENIED decision is persisted")
    void deniedDecision_isPersisted() {
        UUID userId = UUID.randomUUID();
        UUID resourceId = UUID.randomUUID();
        AccessDecision decision = AccessDecision.deny(
                "No policy found — default-deny",
                userId, "attacker@test.com", resourceId, "secret_data", "WRITE");

        AccessDecisionEvent event = new AccessDecisionEvent(decision, "10.0.0.1");

        listener.onAccessDecision(event);

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());

        AuditLog saved = captor.getValue();
        assertThat(saved.getDecision()).isEqualTo("DENIED");
        assertThat(saved.getAction()).isEqualTo(Action.WRITE);
    }

    @Test
    @DisplayName("Repository exception does not propagate (audit failure must never break access check)")
    void repositoryException_doesNotPropagate() {
        AccessDecision decision = AccessDecision.deny(
                "test", UUID.randomUUID(), "test@test.com",
                UUID.randomUUID(), "res", "READ");
        AccessDecisionEvent event = new AccessDecisionEvent(decision, "1.2.3.4");

        when(auditLogRepository.save(any())).thenThrow(new RuntimeException("DB down"));

        // Should NOT throw
        listener.onAccessDecision(event);

        verify(auditLogRepository).save(any());
    }
}
