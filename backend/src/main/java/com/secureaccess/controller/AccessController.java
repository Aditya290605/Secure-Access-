package com.secureaccess.controller;

import com.secureaccess.domain.Action;
import com.secureaccess.domain.User;
import com.secureaccess.dto.AccessDecision;
import com.secureaccess.dto.AccessRequest;
import com.secureaccess.event.AccessDecisionEvent;
import com.secureaccess.repository.UserRepository;
import com.secureaccess.service.AccessEvaluator;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoint for requesting access to a resource.
 * Every access check fires an AccessDecisionEvent for audit logging.
 */
@RestController
@RequestMapping("/api/access")
public class AccessController {

    private final AccessEvaluator accessEvaluator;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    public AccessController(AccessEvaluator accessEvaluator,
                            UserRepository userRepository,
                            ApplicationEventPublisher eventPublisher) {
        this.accessEvaluator = accessEvaluator;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Check access for the currently authenticated user.
     * POST /api/access/check
     */
    @PostMapping("/check")
    public ResponseEntity<AccessDecision> checkAccess(
            @Valid @RequestBody AccessRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));

        Action action = parseAction(request.action());
        AccessDecision decision = accessEvaluator.evaluate(
                user.getId(), request.resourceId(), action);

        eventPublisher.publishEvent(new AccessDecisionEvent(decision, getClientIp(httpRequest)));

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
            @Valid @RequestBody AccessRequest request,
            HttpServletRequest httpRequest) {

        Action action = parseAction(request.action());
        AccessDecision decision = accessEvaluator.evaluate(
                userId, request.resourceId(), action);

        eventPublisher.publishEvent(new AccessDecisionEvent(decision, getClientIp(httpRequest)));

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

    /**
     * Extract client IP, respecting X-Forwarded-For for reverse-proxied deployments
     * (App Runner, ALB, Nginx).
     */
    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isEmpty()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
