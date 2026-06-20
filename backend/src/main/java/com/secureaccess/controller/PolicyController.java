package com.secureaccess.controller;

import com.secureaccess.dto.PolicyRequest;
import com.secureaccess.dto.PolicyResponse;
import com.secureaccess.service.PolicyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/policies")
public class PolicyController {

    private final PolicyService policyService;

    public PolicyController(PolicyService policyService) {
        this.policyService = policyService;
    }

    @PostMapping
    public ResponseEntity<PolicyResponse> create(@Valid @RequestBody PolicyRequest request) {
        PolicyResponse response = policyService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<PolicyResponse>> findAll() {
        return ResponseEntity.ok(policyService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PolicyResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(policyService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PolicyResponse> update(@PathVariable UUID id,
                                                  @Valid @RequestBody PolicyRequest request) {
        return ResponseEntity.ok(policyService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        policyService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
