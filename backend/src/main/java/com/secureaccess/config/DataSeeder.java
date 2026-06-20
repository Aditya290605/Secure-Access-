package com.secureaccess.config;

import com.secureaccess.domain.*;
import com.secureaccess.repository.PolicyRepository;
import com.secureaccess.repository.ResourceRepository;
import com.secureaccess.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Seeds demo data when running with the 'h2' profile.
 * Only runs if no users exist yet (idempotent).
 *
 * Creates:
 *   - 3 users: admin, editor, viewer
 *   - 4 resources with varying sensitivity
 *   - 6 policies covering different access patterns
 */
@Component
@Profile("h2")
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final PolicyRepository policyRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository,
                      ResourceRepository resourceRepository,
                      PolicyRepository policyRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.policyRepository = policyRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Data already exists — skipping seed");
            return;
        }

        log.info("Seeding demo data...");

        // --- Users ---
        User admin = userRepository.save(new User(
                "admin@secureaccess.io",
                passwordEncoder.encode("admin123"),
                Set.of(Role.ADMIN)));

        User editor = userRepository.save(new User(
                "editor@secureaccess.io",
                passwordEncoder.encode("editor123"),
                Set.of(Role.EDITOR)));

        User viewer = userRepository.save(new User(
                "viewer@secureaccess.io",
                passwordEncoder.encode("viewer123"),
                Set.of(Role.VIEWER)));

        log.info("Created users: admin, editor, viewer");

        // --- Resources ---
        Resource customerData = resourceRepository.save(new Resource(
                "customer_pii", "Customer personally identifiable information",
                "data-team@secureaccess.io", SensitivityLevel.RESTRICTED));

        Resource analytics = resourceRepository.save(new Resource(
                "analytics_dashboard", "Business analytics and metrics",
                "analytics@secureaccess.io", SensitivityLevel.INTERNAL));

        Resource publicDocs = resourceRepository.save(new Resource(
                "public_docs", "Public documentation and guides",
                "docs@secureaccess.io", SensitivityLevel.PUBLIC));

        Resource financials = resourceRepository.save(new Resource(
                "financial_reports", "Quarterly financial reports",
                "finance@secureaccess.io", SensitivityLevel.CONFIDENTIAL));

        log.info("Created 4 resources");

        // --- Policies ---
        // Admin can read/write everything
        policyRepository.save(new Policy(Role.ADMIN, customerData, Permission.WRITE, null));
        policyRepository.save(new Policy(Role.ADMIN, financials, Permission.WRITE, null));

        // Editor can read customer data, read/write analytics
        policyRepository.save(new Policy(Role.EDITOR, customerData, Permission.READ, null));
        policyRepository.save(new Policy(Role.EDITOR, analytics, Permission.WRITE, null));

        // Viewer can read analytics and public docs
        policyRepository.save(new Policy(Role.VIEWER, analytics, Permission.READ, null));
        policyRepository.save(new Policy(Role.VIEWER, publicDocs, Permission.READ, null));

        // Note: no policy for VIEWER on customer_pii or financials → default-deny
        // Note: no policy for EDITOR on financials → default-deny

        log.info("Created 6 policies");
        log.info("Demo data seeded successfully. Login with: admin@secureaccess.io / admin123");
    }
}
