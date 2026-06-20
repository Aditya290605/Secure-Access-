package com.secureaccess.service;

import com.secureaccess.domain.Role;
import com.secureaccess.domain.User;
import com.secureaccess.dto.AuthResponse;
import com.secureaccess.dto.LoginRequest;
import com.secureaccess.dto.RegisterRequest;
import com.secureaccess.repository.UserRepository;
import com.secureaccess.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.authenticationManager = authenticationManager;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already registered: " + request.email());
        }

        Set<Role> roles = resolveRoles(request.roles());
        User user = new User(
                request.email(),
                passwordEncoder.encode(request.password()),
                roles);

        user = userRepository.save(user);

        String token = tokenProvider.generateToken(user.getEmail());
        return toResponse(token, user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String token = tokenProvider.generateToken(user.getEmail());
        return toResponse(token, user);
    }

    private Set<Role> resolveRoles(Set<String> roleNames) {
        if (roleNames == null || roleNames.isEmpty()) {
            return Set.of(Role.VIEWER); // default role
        }
        Set<Role> roles = new HashSet<>();
        for (String name : roleNames) {
            try {
                roles.add(Role.valueOf(name.toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid role: " + name);
            }
        }
        return roles;
    }

    private AuthResponse toResponse(String token, User user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(Role::name)
                .collect(Collectors.toSet());
        return new AuthResponse(token, user.getId(), user.getEmail(), roleNames);
    }
}
