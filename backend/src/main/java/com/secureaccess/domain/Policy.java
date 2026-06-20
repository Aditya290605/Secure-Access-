package com.secureaccess.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

/**
 * A policy links a Role to a Resource with a Permission.
 *
 * Policy evaluation rules (enforced by AccessEvaluator):
 *   1. DENY always wins — if any matching policy says DENY, the request is denied.
 *   2. A matching READ policy allows READ but not WRITE.
 *   3. A matching WRITE policy allows both READ and WRITE (WRITE implies READ).
 *   4. If no policy matches the user's roles for the resource, access is denied (default-deny).
 */
@Entity
@Table(name = "policies",
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"role", "resource_id", "permission"},
           name = "uk_policy_role_resource_permission"))
public class Policy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Permission permission;

    /**
     * Optional simple condition in v1 (e.g., "owner_only", "business_hours").
     * Kept as a plain string for extensibility without over-engineering.
     * Null means unconditional.
     */
    private String conditionExpression;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Policy() {
        // JPA
    }

    public Policy(Role role, Resource resource, Permission permission, String conditionExpression) {
        this.role = role;
        this.resource = resource;
        this.permission = permission;
        this.conditionExpression = conditionExpression;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // --- Getters & Setters ---

    public UUID getId() {
        return id;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Resource getResource() {
        return resource;
    }

    public void setResource(Resource resource) {
        this.resource = resource;
    }

    public Permission getPermission() {
        return permission;
    }

    public void setPermission(Permission permission) {
        this.permission = permission;
    }

    public String getConditionExpression() {
        return conditionExpression;
    }

    public void setConditionExpression(String conditionExpression) {
        this.conditionExpression = conditionExpression;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
