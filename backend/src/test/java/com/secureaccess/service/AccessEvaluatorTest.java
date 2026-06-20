package com.secureaccess.service;

import com.secureaccess.domain.*;
import com.secureaccess.dto.AccessDecision;
import com.secureaccess.repository.PolicyRepository;
import com.secureaccess.repository.ResourceRepository;
import com.secureaccess.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Unit tests for AccessEvaluator — the core policy engine.
 * Tests cover all evaluation rules:
 *   - Explicit allow (READ, WRITE)
 *   - Explicit deny
 *   - Default-deny (no matching policy)
 *   - Deny-wins on conflict (DENY overrides READ/WRITE)
 *   - WRITE implies READ
 *   - User/resource not found
 *   - User with no roles
 */
@ExtendWith(MockitoExtension.class)
class AccessEvaluatorTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ResourceRepository resourceRepository;

    @Mock
    private PolicyRepository policyRepository;

    private AccessEvaluator evaluator;

    private UUID userId;
    private UUID resourceId;
    private User testUser;
    private Resource testResource;

    @BeforeEach
    void setUp() {
        evaluator = new AccessEvaluator(userRepository, resourceRepository, policyRepository);

        userId = UUID.randomUUID();
        resourceId = UUID.randomUUID();

        testUser = new User("viewer@test.com", "hashed", Set.of(Role.VIEWER));
        // Use reflection to set the ID since it's generated
        setId(testUser, userId);

        testResource = new Resource("customer_data", "Customer PII dataset",
                "admin@test.com", SensitivityLevel.CONFIDENTIAL);
        setId(testResource, resourceId);
    }

    @Nested
    @DisplayName("Default-Deny Rule")
    class DefaultDeny {

        @Test
        @DisplayName("No matching policy → DENIED (default-deny)")
        void noMatchingPolicy_shouldDeny() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(resourceRepository.findById(resourceId)).thenReturn(Optional.of(testResource));
            when(policyRepository.findByResourceIdAndRoleIn(eq(resourceId), any()))
                    .thenReturn(Collections.emptyList());

            AccessDecision decision = evaluator.evaluate(userId, resourceId, Action.READ);

            assertThat(decision.allowed()).isFalse();
            assertThat(decision.decision()).isEqualTo("DENIED");
            assertThat(decision.reason()).contains("default-deny");
        }

        @Test
        @DisplayName("User with no roles → DENIED")
        void userWithNoRoles_shouldDeny() {
            User noRoleUser = new User("norole@test.com", "hashed", Set.of());
            setId(noRoleUser, userId);

            when(userRepository.findById(userId)).thenReturn(Optional.of(noRoleUser));
            when(resourceRepository.findById(resourceId)).thenReturn(Optional.of(testResource));

            AccessDecision decision = evaluator.evaluate(userId, resourceId, Action.READ);

            assertThat(decision.allowed()).isFalse();
            assertThat(decision.reason()).contains("no roles");
        }
    }

    @Nested
    @DisplayName("Explicit Allow")
    class ExplicitAllow {

        @Test
        @DisplayName("READ policy + READ action → ALLOWED")
        void readPolicyReadAction_shouldAllow() {
            Policy readPolicy = new Policy(Role.VIEWER, testResource, Permission.READ, null);

            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(resourceRepository.findById(resourceId)).thenReturn(Optional.of(testResource));
            when(policyRepository.findByResourceIdAndRoleIn(eq(resourceId), any()))
                    .thenReturn(List.of(readPolicy));

            AccessDecision decision = evaluator.evaluate(userId, resourceId, Action.READ);

            assertThat(decision.allowed()).isTrue();
            assertThat(decision.decision()).isEqualTo("ALLOWED");
            assertThat(decision.reason()).contains("Access granted");
        }

        @Test
        @DisplayName("WRITE policy + WRITE action → ALLOWED")
        void writePolicyWriteAction_shouldAllow() {
            User editorUser = new User("editor@test.com", "hashed", Set.of(Role.EDITOR));
            setId(editorUser, userId);
            Policy writePolicy = new Policy(Role.EDITOR, testResource, Permission.WRITE, null);

            when(userRepository.findById(userId)).thenReturn(Optional.of(editorUser));
            when(resourceRepository.findById(resourceId)).thenReturn(Optional.of(testResource));
            when(policyRepository.findByResourceIdAndRoleIn(eq(resourceId), any()))
                    .thenReturn(List.of(writePolicy));

            AccessDecision decision = evaluator.evaluate(userId, resourceId, Action.WRITE);

            assertThat(decision.allowed()).isTrue();
            assertThat(decision.decision()).isEqualTo("ALLOWED");
        }

        @Test
        @DisplayName("WRITE policy + READ action → ALLOWED (WRITE implies READ)")
        void writePolicyReadAction_shouldAllow() {
            User editorUser = new User("editor@test.com", "hashed", Set.of(Role.EDITOR));
            setId(editorUser, userId);
            Policy writePolicy = new Policy(Role.EDITOR, testResource, Permission.WRITE, null);

            when(userRepository.findById(userId)).thenReturn(Optional.of(editorUser));
            when(resourceRepository.findById(resourceId)).thenReturn(Optional.of(testResource));
            when(policyRepository.findByResourceIdAndRoleIn(eq(resourceId), any()))
                    .thenReturn(List.of(writePolicy));

            AccessDecision decision = evaluator.evaluate(userId, resourceId, Action.READ);

            assertThat(decision.allowed()).isTrue();
            assertThat(decision.reason()).contains("Access granted");
        }
    }

    @Nested
    @DisplayName("Explicit Deny")
    class ExplicitDeny {

        @Test
        @DisplayName("DENY policy → DENIED regardless of action")
        void denyPolicy_shouldDeny() {
            Policy denyPolicy = new Policy(Role.VIEWER, testResource, Permission.DENY, null);

            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(resourceRepository.findById(resourceId)).thenReturn(Optional.of(testResource));
            when(policyRepository.findByResourceIdAndRoleIn(eq(resourceId), any()))
                    .thenReturn(List.of(denyPolicy));

            AccessDecision decision = evaluator.evaluate(userId, resourceId, Action.READ);

            assertThat(decision.allowed()).isFalse();
            assertThat(decision.decision()).isEqualTo("DENIED");
            assertThat(decision.reason()).contains("Explicit DENY");
        }
    }

    @Nested
    @DisplayName("Deny-Wins on Conflict")
    class DenyWins {

        @Test
        @DisplayName("READ + DENY policies → DENIED (deny-wins rule)")
        void readAndDenyConflict_denyWins() {
            // User has multiple roles: one grants READ, the other DENY
            User multiRoleUser = new User("multi@test.com", "hashed",
                    Set.of(Role.VIEWER, Role.EDITOR));
            setId(multiRoleUser, userId);

            Policy readPolicy = new Policy(Role.VIEWER, testResource, Permission.READ, null);
            Policy denyPolicy = new Policy(Role.EDITOR, testResource, Permission.DENY, null);

            when(userRepository.findById(userId)).thenReturn(Optional.of(multiRoleUser));
            when(resourceRepository.findById(resourceId)).thenReturn(Optional.of(testResource));
            when(policyRepository.findByResourceIdAndRoleIn(eq(resourceId), any()))
                    .thenReturn(List.of(readPolicy, denyPolicy));

            AccessDecision decision = evaluator.evaluate(userId, resourceId, Action.READ);

            assertThat(decision.allowed()).isFalse();
            assertThat(decision.decision()).isEqualTo("DENIED");
            assertThat(decision.reason()).contains("deny-wins");
        }

        @Test
        @DisplayName("WRITE + DENY policies → DENIED (deny-wins rule)")
        void writeAndDenyConflict_denyWins() {
            User multiRoleUser = new User("multi@test.com", "hashed",
                    Set.of(Role.ADMIN, Role.VIEWER));
            setId(multiRoleUser, userId);

            Policy writePolicy = new Policy(Role.ADMIN, testResource, Permission.WRITE, null);
            Policy denyPolicy = new Policy(Role.VIEWER, testResource, Permission.DENY, null);

            when(userRepository.findById(userId)).thenReturn(Optional.of(multiRoleUser));
            when(resourceRepository.findById(resourceId)).thenReturn(Optional.of(testResource));
            when(policyRepository.findByResourceIdAndRoleIn(eq(resourceId), any()))
                    .thenReturn(List.of(writePolicy, denyPolicy));

            AccessDecision decision = evaluator.evaluate(userId, resourceId, Action.WRITE);

            assertThat(decision.allowed()).isFalse();
            assertThat(decision.reason()).contains("deny-wins");
        }
    }

    @Nested
    @DisplayName("Insufficient Permissions")
    class InsufficientPermissions {

        @Test
        @DisplayName("READ policy + WRITE action → DENIED (READ doesn't grant WRITE)")
        void readPolicyWriteAction_shouldDeny() {
            Policy readPolicy = new Policy(Role.VIEWER, testResource, Permission.READ, null);

            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(resourceRepository.findById(resourceId)).thenReturn(Optional.of(testResource));
            when(policyRepository.findByResourceIdAndRoleIn(eq(resourceId), any()))
                    .thenReturn(List.of(readPolicy));

            AccessDecision decision = evaluator.evaluate(userId, resourceId, Action.WRITE);

            assertThat(decision.allowed()).isFalse();
            assertThat(decision.reason()).contains("insufficient permissions");
        }
    }

    @Nested
    @DisplayName("Entity Not Found")
    class EntityNotFound {

        @Test
        @DisplayName("User not found → DENIED")
        void userNotFound_shouldDeny() {
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            AccessDecision decision = evaluator.evaluate(userId, resourceId, Action.READ);

            assertThat(decision.allowed()).isFalse();
            assertThat(decision.reason()).contains("User not found");
        }

        @Test
        @DisplayName("Resource not found → DENIED")
        void resourceNotFound_shouldDeny() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(resourceRepository.findById(resourceId)).thenReturn(Optional.empty());

            AccessDecision decision = evaluator.evaluate(userId, resourceId, Action.READ);

            assertThat(decision.allowed()).isFalse();
            assertThat(decision.reason()).contains("Resource not found");
        }
    }

    /**
     * Helper to set the UUID id field on an entity via reflection,
     * since it's @GeneratedValue and has no setter.
     */
    private void setId(Object entity, UUID id) {
        try {
            var field = entity.getClass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set id via reflection", e);
        }
    }
}
