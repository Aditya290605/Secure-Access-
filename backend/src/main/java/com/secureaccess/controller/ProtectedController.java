package com.secureaccess.controller;

import com.secureaccess.domain.Role;
import com.secureaccess.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Protected endpoints for auth verification and admin operations.
 */
@RestController
@RequestMapping("/api")
public class ProtectedController {

    private final UserRepository userRepository;

    public ProtectedController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

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

    /**
     * Admin-only: list all users (for the "Try Access" screen).
     * Returns id, email, and roles — never the password.
     */
    @GetMapping("/admin/users")
    public ResponseEntity<List<Map<String, Object>>> listUsers() {
        var users = userRepository.findAll().stream()
                .map(user -> Map.<String, Object>of(
                        "id", user.getId(),
                        "email", user.getEmail(),
                        "roles", user.getRoles().stream()
                                .map(Role::name)
                                .collect(Collectors.toList())
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }
}
