package com.secureaccess.repository;

import com.secureaccess.domain.Resource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ResourceRepository extends JpaRepository<Resource, UUID> {

    Optional<Resource> findByName(String name);

    boolean existsByName(String name);
}
