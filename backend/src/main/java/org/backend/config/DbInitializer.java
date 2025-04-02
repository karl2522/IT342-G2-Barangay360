package org.backend.config;

import org.backend.model.ERole;
import org.backend.model.Role;
import org.backend.repository.RoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import jakarta.transaction.Transactional;

@Component
public class DbInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DbInitializer.class);

    @Autowired
    private RoleRepository roleRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Initialize roles if they don't exist
        for (ERole role : ERole.values()) {
            if (roleRepository.findByName(role).isEmpty()) {
                Role newRole = new Role();
                newRole.setName(role);
                try {
                    roleRepository.save(newRole);
                    logger.info("Created role: {}", role);
                } catch (Exception e) {
                    logger.error("Error creating role: {}", role, e);
                }
            }
        }
    }
}
