package org.backend.repository;

import org.backend.model.Appeal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppealRepository extends JpaRepository<Appeal, Long> {
    // Find appeals by status, e.g., find all PENDING appeals
    List<Appeal> findByStatus(Appeal.AppealStatus status);

    // Find appeals by username
    List<Appeal> findByUsername(String username);
}