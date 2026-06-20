package com.secureaccess.domain;

/**
 * The permission a policy grants (or denies) on a resource.
 * READ  — allows read access
 * WRITE — allows write access
 * DENY  — explicitly denies all access (overrides READ/WRITE — deny-wins rule)
 */
public enum Permission {
    READ,
    WRITE,
    DENY
}
