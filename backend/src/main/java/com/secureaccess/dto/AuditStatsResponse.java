package com.secureaccess.dto;

/**
 * Dashboard statistics from the audit trail.
 */
public record AuditStatsResponse(
        long totalChecks,
        long allowedCount,
        long deniedCount,
        double allowRate
) {}
