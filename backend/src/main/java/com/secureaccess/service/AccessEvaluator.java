package com.secureaccess.service;

import com.secureaccess.domain.*;
import com.secureaccess.dto.AccessDecision;
import com.secureaccess.repository.PolicyRepository;
import com.secureaccess.repository.ResourceRepository;
import com.secureaccess.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * The heart of SecureAccess — evaluates whether a user can perform an action on a resource.
 *
 * <h3>Evaluation Rules (in order):</h3>
 * <ol>
 *   <li><b>User/Resource existence:</b> If either doesn't exist, deny with explanation.</li>
 *   <li><b>Policy lookup:</b> Find all policies for this resource that match any of the user's roles.</li>
 *   <li><b>Deny-wins:</b> If ANY matching policy has permission=DENY, the request is denied.
 *       This is a deliberate security-first design — a single DENY policy overrides
 *       any number of ALLOW policies.</li>
 *   <li><b>Permission matching:</b> Check if any remaining policy grants the requested action.
 *       WRITE implies READ (a WRITE policy allows both READ and WRITE actions).</li>
 *   <li><b>Default-deny:</b> If no policy matches at all, access is denied.
 *       This is the zero-trust baseline — no access without an explicit grant.</li>
 * </ol>
 */
@Service
public class AccessEvaluator {

    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final PolicyRepository policyRepository;

    public AccessEvaluator(UserRepository userRepository,
                           ResourceRepository resourceRepository,
                           PolicyRepository policyRepository) {
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.policyRepository = policyRepository;
    }

    /**
     * Evaluate access: given a user, resource, and desired action, return an explainable decision.
     */
    public AccessDecision evaluate(UUID userId, UUID resourceId, Action action) {
        // 1. Validate user exists
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return AccessDecision.deny(
                    "User not found: " + userId,
                    userId, "unknown", resourceId, "unknown", action.name());
        }

        // 2. Validate resource exists
        Resource resource = resourceRepository.findById(resourceId).orElse(null);
        if (resource == null) {
            return AccessDecision.deny(
                    "Resource not found: " + resourceId,
                    userId, user.getEmail(), resourceId, "unknown", action.name());
        }

        // 3. Find all policies matching this resource and the user's roles
        Set<Role> userRoles = user.getRoles();
        if (userRoles.isEmpty()) {
            return AccessDecision.deny(
                    "User has no roles assigned — default-deny applies",
                    userId, user.getEmail(), resourceId, resource.getName(), action.name());
        }

        List<Policy> matchingPolicies = policyRepository
                .findByResourceIdAndRoleIn(resourceId, userRoles);

        // 4. No policies match → default-deny
        if (matchingPolicies.isEmpty()) {
            String rolesStr = userRoles.stream().map(Role::name).collect(Collectors.joining(", "));
            return AccessDecision.deny(
                    "No policy found for roles [" + rolesStr + "] on resource '"
                            + resource.getName() + "' — default-deny applies",
                    userId, user.getEmail(), resourceId, resource.getName(), action.name());
        }

        // 5. Deny-wins: check for any DENY policy
        List<Policy> denyPolicies = matchingPolicies.stream()
                .filter(p -> p.getPermission() == Permission.DENY)
                .toList();

        if (!denyPolicies.isEmpty()) {
            Policy denyPolicy = denyPolicies.get(0);
            return AccessDecision.deny(
                    "Explicit DENY policy found: role=" + denyPolicy.getRole().name()
                            + " on resource '" + resource.getName()
                            + "' — deny-wins rule applied",
                    userId, user.getEmail(), resourceId, resource.getName(), action.name());
        }

        // 6. Check if any policy grants the requested action
        boolean granted = matchingPolicies.stream().anyMatch(p -> grantsAction(p, action));

        if (granted) {
            // Find the specific policy that granted access for the reason string
            Policy grantingPolicy = matchingPolicies.stream()
                    .filter(p -> grantsAction(p, action))
                    .findFirst()
                    .orElseThrow();

            return AccessDecision.allow(
                    "Access granted by policy: role=" + grantingPolicy.getRole().name()
                            + ", permission=" + grantingPolicy.getPermission().name()
                            + " on resource '" + resource.getName() + "'",
                    userId, user.getEmail(), resourceId, resource.getName(), action.name());
        }

        // 7. Policies exist but none grant the requested action
        String existingPermissions = matchingPolicies.stream()
                .map(p -> p.getRole().name() + ":" + p.getPermission().name())
                .collect(Collectors.joining(", "));
        return AccessDecision.deny(
                "No policy grants " + action.name() + " access. Existing policies: ["
                        + existingPermissions + "] — insufficient permissions",
                userId, user.getEmail(), resourceId, resource.getName(), action.name());
    }

    /**
     * WRITE permission implies READ access.
     * A READ policy only grants READ, not WRITE.
     */
    private boolean grantsAction(Policy policy, Action action) {
        return switch (action) {
            case READ -> policy.getPermission() == Permission.READ
                    || policy.getPermission() == Permission.WRITE;
            case WRITE -> policy.getPermission() == Permission.WRITE;
        };
    }
}
