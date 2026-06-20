package com.secureaccess.repository;

import com.secureaccess.domain.Policy;
import com.secureaccess.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface PolicyRepository extends JpaRepository<Policy, UUID> {

    /**
     * Find all policies for a given resource that apply to any of the specified roles.
     * This is the core query used by AccessEvaluator.
     */
    List<Policy> findByResourceIdAndRoleIn(UUID resourceId, Collection<Role> roles);

    /**
     * Find all policies for a given resource (for admin listing).
     */
    List<Policy> findByResourceId(UUID resourceId);
}
