package org.backend.repository;

import org.backend.model.DocumentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface DocumentTemplateRepository extends JpaRepository<DocumentTemplate, Long> {
    Optional<DocumentTemplate> findByServiceTypeAndIsActiveTrue(String serviceType);
    Optional<DocumentTemplate> findByTemplateId(String templateId);
} 