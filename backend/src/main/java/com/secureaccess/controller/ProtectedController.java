package com.secureaccess.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Protected endpoints to verify auth + role-based access is working end-to-end.
 *
 * GET /api/me            — any authenticated user
 * GET /api/admin/health  — ADMIN role only
 */
@RestController
@RequestMapping("/api")
public class ProtectedController {

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
                "email", authentication.getName(),
                "authorities", authentication.getAuthorities().stream()
                        .map(Object::toString).toList()
        ));
    }

    @GetMapping("/admin/health")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> adminHealth() {
        return ResponseEntity.ok(Map.of(
                "status", "healthy",
                "message", "You have ADMIN access"
        ));
    }
}
