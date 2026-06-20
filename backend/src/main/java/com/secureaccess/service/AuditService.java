package com.secureaccess.service;

import com.secureaccess.domain.AuditLog;
import com.secureaccess.dto.AuditLogResponse;
import com.secureaccess.dto.AuditStatsResponse;
import com.secureaccess.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Query audit logs with optional filters and pagination.
     */
    public Page<AuditLogResponse> findLogs(UUID userId, UUID resourceId, String decision,
                                            Instant from, Instant to, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> logs = auditLogRepository.findWithFilters(
                userId, resourceId, decision, from, to, pageable);
        return logs.map(this::toResponse);
    }

    /**
     * Dashboard statistics: total checks, allowed, denied, allow rate.
     */
    public AuditStatsResponse getStats() {
        long allowed = auditLogRepository.countByDecision("ALLOWED");
        long denied = auditLogRepository.countByDecision("DENIED");
        long total = allowed + denied;
        double rate = total > 0 ? (double) allowed / total * 100.0 : 0.0;
        return new AuditStatsResponse(total, allowed, denied, Math.round(rate * 10) / 10.0);
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getUserId(),
                log.getUserEmail(),
                log.getResourceId(),
                log.getResourceName(),
                log.getAction().name(),
                log.getDecision(),
                log.getReason(),
                log.getTimestamp(),
                log.getIpAddress());
    }
}
