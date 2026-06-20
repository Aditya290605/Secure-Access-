package com.secureaccess.domain;

/**
 * Actions a user can request on a resource.
 * Kept separate from Permission because Permission includes DENY (a policy stance),
 * while Action represents what the user is trying to do.
 */
public enum Action {
    READ,
    WRITE
}
