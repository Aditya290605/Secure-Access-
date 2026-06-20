package com.secureaccess.controller;

import com.secureaccess.dto.AuditLogResponse;
import com.secureaccess.dto.AuditStatsResponse;
import com.secureaccess.service.AuditService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Admin-only audit log endpoints.
 * Under /api/admin/ — protected by SecurityConfig's hasRole('ADMIN') rule.
 */
@RestController
@RequestMapping("/api/admin/audit")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    /**
     * Paginated, filterable audit log query.
     *
     * GET /api/admin/audit/logs?page=0&size=20&userId=...&resourceId=...&decision=DENIED&from=...&to=...
     */
    @GetMapping("/logs")
    public ResponseEntity<Page<AuditLogResponse>> getLogs(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) UUID resourceId,
            @RequestParam(required = false) String decision,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<AuditLogResponse> logs = auditService.findLogs(
                userId, resourceId, decision, from, to, page, size);
        return ResponseEntity.ok(logs);
    }

    /**
     * Dashboard stats: total checks, allowed, denied, allow rate.
     */
    @GetMapping("/stats")
    public ResponseEntity<AuditStatsResponse> getStats() {
        return ResponseEntity.ok(auditService.getStats());
    }
}
