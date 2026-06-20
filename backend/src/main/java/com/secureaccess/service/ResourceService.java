package com.secureaccess.service;

import com.secureaccess.domain.Resource;
import com.secureaccess.domain.SensitivityLevel;
import com.secureaccess.dto.ResourceRequest;
import com.secureaccess.dto.ResourceResponse;
import com.secureaccess.repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    public ResourceResponse create(ResourceRequest request) {
        if (resourceRepository.existsByName(request.name())) {
            throw new IllegalArgumentException("Resource already exists: " + request.name());
        }

        SensitivityLevel level = parseSensitivityLevel(request.sensitivityLevel());
        Resource resource = new Resource(request.name(), request.description(),
                request.owner(), level);
        resource = resourceRepository.save(resource);
        return toResponse(resource);
    }

    public List<ResourceResponse> findAll() {
        return resourceRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ResourceResponse findById(UUID id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Resource not found: " + id));
        return toResponse(resource);
    }

    public ResourceResponse update(UUID id, ResourceRequest request) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Resource not found: " + id));

        resource.setName(request.name());
        resource.setDescription(request.description());
        resource.setOwner(request.owner());
        resource.setSensitivityLevel(parseSensitivityLevel(request.sensitivityLevel()));
        resource = resourceRepository.save(resource);
        return toResponse(resource);
    }

    public void delete(UUID id) {
        if (!resourceRepository.existsById(id)) {
            throw new IllegalArgumentException("Resource not found: " + id);
        }
        resourceRepository.deleteById(id);
    }

    private SensitivityLevel parseSensitivityLevel(String level) {
        try {
            return SensitivityLevel.valueOf(level.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid sensitivity level: " + level);
        }
    }

    private ResourceResponse toResponse(Resource resource) {
        return new ResourceResponse(
                resource.getId(),
                resource.getName(),
                resource.getDescription(),
                resource.getOwner(),
                resource.getSensitivityLevel().name(),
                resource.getCreatedAt(),
                resource.getUpdatedAt());
    }
}
