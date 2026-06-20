package com.secureaccess.service;

import com.secureaccess.domain.Permission;
import com.secureaccess.domain.Policy;
import com.secureaccess.domain.Resource;
import com.secureaccess.domain.Role;
import com.secureaccess.dto.PolicyRequest;
import com.secureaccess.dto.PolicyResponse;
import com.secureaccess.repository.PolicyRepository;
import com.secureaccess.repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PolicyService {

    private final PolicyRepository policyRepository;
    private final ResourceRepository resourceRepository;

    public PolicyService(PolicyRepository policyRepository,
                         ResourceRepository resourceRepository) {
        this.policyRepository = policyRepository;
        this.resourceRepository = resourceRepository;
    }

    public PolicyResponse create(PolicyRequest request) {
        Role role = parseRole(request.role());
        Permission permission = parsePermission(request.permission());
        Resource resource = resourceRepository.findById(request.resourceId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Resource not found: " + request.resourceId()));

        Policy policy = new Policy(role, resource, permission, request.conditionExpression());
        policy = policyRepository.save(policy);
        return toResponse(policy);
    }

    public List<PolicyResponse> findAll() {
        return policyRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public PolicyResponse findById(UUID id) {
        Policy policy = policyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Policy not found: " + id));
        return toResponse(policy);
    }

    public PolicyResponse update(UUID id, PolicyRequest request) {
        Policy policy = policyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Policy not found: " + id));

        Role role = parseRole(request.role());
        Permission permission = parsePermission(request.permission());
        Resource resource = resourceRepository.findById(request.resourceId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Resource not found: " + request.resourceId()));

        policy.setRole(role);
        policy.setResource(resource);
        policy.setPermission(permission);
        policy.setConditionExpression(request.conditionExpression());
        policy = policyRepository.save(policy);
        return toResponse(policy);
    }

    public void delete(UUID id) {
        if (!policyRepository.existsById(id)) {
            throw new IllegalArgumentException("Policy not found: " + id);
        }
        policyRepository.deleteById(id);
    }

    private Role parseRole(String role) {
        try {
            return Role.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + role);
        }
    }

    private Permission parsePermission(String permission) {
        try {
            return Permission.valueOf(permission.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid permission: " + permission);
        }
    }

    private PolicyResponse toResponse(Policy policy) {
        return new PolicyResponse(
                policy.getId(),
                policy.getRole().name(),
                policy.getResource().getId(),
                policy.getResource().getName(),
                policy.getPermission().name(),
                policy.getConditionExpression(),
                policy.getCreatedAt(),
                policy.getUpdatedAt());
    }
}
