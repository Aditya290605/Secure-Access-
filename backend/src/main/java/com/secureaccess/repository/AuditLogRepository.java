package com.secureaccess.repository;

import com.secureaccess.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    /**
     * Flexible query supporting optional filters.
     * Each filter is applied only when its parameter is non-null.
     * This avoids the combinatorial explosion of creating separate methods
     * for every filter combination.
     */
    @Query("SELECT a FROM AuditLog a WHERE " +
            "(:userId IS NULL OR a.userId = :userId) AND " +
            "(:resourceId IS NULL OR a.resourceId = :resourceId) AND " +
            "(:decision IS NULL OR a.decision = :decision) AND " +
            "(:from IS NULL OR a.timestamp >= :from) AND " +
            "(:to IS NULL OR a.timestamp <= :to) " +
            "ORDER BY a.timestamp DESC")
    Page<AuditLog> findWithFilters(
            @Param("userId") UUID userId,
            @Param("resourceId") UUID resourceId,
            @Param("decision") String decision,
            @Param("from") Instant from,
            @Param("to") Instant to,
            Pageable pageable);

    /**
     * Count decisions by type (for dashboard stats).
     */
    long countByDecision(String decision);
}
