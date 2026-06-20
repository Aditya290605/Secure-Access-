package com.secureaccess.controller;

import com.secureaccess.domain.Action;
import com.secureaccess.domain.User;
import com.secureaccess.dto.AccessDecision;
import com.secureaccess.dto.AccessRequest;
import com.secureaccess.repository.UserRepository;
import com.secureaccess.service.AccessEvaluator;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoint for requesting access to a resource.
 * Any authenticated user can test whether they (or, for admins, any user)
 * have access to a resource.
 */
@RestController
@RequestMapping("/api/access")
public class AccessController {

    private final AccessEvaluator accessEvaluator;
    private final UserRepository userRepository;

    public AccessController(AccessEvaluator accessEvaluator,
                            UserRepository userRepository) {
        this.accessEvaluator = accessEvaluator;
        this.userRepository = userRepository;
    }

    /**
     * Check access for the currently authenticated user.
     * POST /api/access/check
     */
    @PostMapping("/check")
    public ResponseEntity<AccessDecision> checkAccess(
            @Valid @RequestBody AccessRequest request,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));

        Action action = parseAction(request.action());
        AccessDecision decision = accessEvaluator.evaluate(
                user.getId(), request.resourceId(), action);

        return ResponseEntity.ok(decision);
    }

    /**
     * Admin-only: check access for any user by their ID.
     * POST /api/access/admin/check?userId=...
     * Used by the "Try Access" admin screen.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/check")
    public ResponseEntity<AccessDecision> checkAccessForUser(
            @RequestParam java.util.UUID userId,
            @Valid @RequestBody AccessRequest request) {

        Action action = parseAction(request.action());
        AccessDecision decision = accessEvaluator.evaluate(
                userId, request.resourceId(), action);

        return ResponseEntity.ok(decision);
    }

    private Action parseAction(String action) {
        try {
            return Action.valueOf(action.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid action: " + action
                    + ". Valid actions: READ, WRITE");
        }
    }
}
