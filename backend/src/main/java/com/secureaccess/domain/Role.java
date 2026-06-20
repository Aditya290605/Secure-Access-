package com.secureaccess.domain;

/**
 * Fixed set of roles for Phase 1.
 * ADMIN — full platform access, manages policies and users.
 * EDITOR — can modify resources they have policy-granted access to.
 * VIEWER — read-only access where granted by policy.
 */
public enum Role {
    ADMIN,
    EDITOR,
    VIEWER
}
