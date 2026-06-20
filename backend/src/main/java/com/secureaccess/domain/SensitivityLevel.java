package com.secureaccess.domain;

/**
 * Sensitivity classification for a governed resource.
 * Drives how strictly access policies should be enforced in production.
 */
public enum SensitivityLevel {
    PUBLIC,
    INTERNAL,
    CONFIDENTIAL,
    RESTRICTED
}
