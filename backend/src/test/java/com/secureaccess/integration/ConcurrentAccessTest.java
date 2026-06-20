package com.secureaccess.integration;

import com.secureaccess.domain.*;
import com.secureaccess.dto.AccessDecision;
import com.secureaccess.repository.PolicyRepository;
import com.secureaccess.repository.ResourceRepository;
import com.secureaccess.repository.UserRepository;
import com.secureaccess.service.AccessEvaluator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that the AccessEvaluator is thread-safe under concurrent load.
 * 50 threads simultaneously evaluate access for the same user+resource,
 * and all must return the same deterministic result.
 */
@SpringBootTest
@ActiveProfiles("h2")
class ConcurrentAccessTest {

    @Autowired private AccessEvaluator evaluator;
    @Autowired private UserRepository userRepository;
    @Autowired private ResourceRepository resourceRepository;
    @Autowired private PolicyRepository policyRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private UUID userId;
    private UUID resourceId;

    @BeforeEach
    void setUp() {
        String unique = UUID.randomUUID().toString().substring(0, 8);

        User user = new User("concurrent_" + unique + "@test.com",
                passwordEncoder.encode("password123"), Set.of(Role.EDITOR));
        user = userRepository.save(user);
        userId = user.getId();

        Resource resource = new Resource("concurrent_" + unique, "Test data",
                "owner@test.com", SensitivityLevel.INTERNAL);
        resource = resourceRepository.save(resource);
        resourceId = resource.getId();

        Policy policy = new Policy(Role.EDITOR, resource, Permission.WRITE, null);
        policyRepository.save(policy);
    }

    @Test
    @DisplayName("50 concurrent evaluations return consistent ALLOWED results")
    void concurrentEvaluations_allConsistent() throws Exception {
        int threadCount = 50;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startGate = new CountDownLatch(1);

        List<Future<AccessDecision>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            futures.add(executor.submit(() -> {
                startGate.await();
                return evaluator.evaluate(userId, resourceId, Action.WRITE);
            }));
        }

        startGate.countDown();

        List<AccessDecision> results = new ArrayList<>();
        for (Future<AccessDecision> f : futures) {
            results.add(f.get(5, TimeUnit.SECONDS));
        }

        executor.shutdown();

        assertThat(results).hasSize(threadCount);
        assertThat(results).allSatisfy(decision -> {
            assertThat(decision.allowed()).isTrue();
            assertThat(decision.decision()).isEqualTo("ALLOWED");
        });
    }

    @Test
    @DisplayName("50 concurrent evaluations with no matching policy all return DENIED")
    void concurrentDefaultDeny_allConsistent() throws Exception {
        String unique = UUID.randomUUID().toString().substring(0, 8);
        User viewerUser = new User("viewer_conc_" + unique + "@test.com",
                passwordEncoder.encode("password123"), Set.of(Role.VIEWER));
        viewerUser = userRepository.save(viewerUser);
        UUID viewerUserId = viewerUser.getId();

        int threadCount = 50;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startGate = new CountDownLatch(1);

        List<Future<AccessDecision>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            futures.add(executor.submit(() -> {
                startGate.await();
                return evaluator.evaluate(viewerUserId, resourceId, Action.READ);
            }));
        }

        startGate.countDown();

        List<AccessDecision> results = new ArrayList<>();
        for (Future<AccessDecision> f : futures) {
            results.add(f.get(5, TimeUnit.SECONDS));
        }

        executor.shutdown();

        assertThat(results).hasSize(threadCount);
        assertThat(results).allSatisfy(decision -> {
            assertThat(decision.allowed()).isFalse();
            assertThat(decision.decision()).isEqualTo("DENIED");
        });
    }
}
