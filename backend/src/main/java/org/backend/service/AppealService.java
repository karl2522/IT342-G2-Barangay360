package org.backend.service;

import org.backend.exception.ResourceNotFoundException;
import org.backend.model.Appeal;
import org.backend.model.User;
import org.backend.payload.request.AppealRequest;
import org.backend.repository.AppealRepository;
import org.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AppealService {

    @Autowired
    private AppealRepository appealRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Transactional
    public Appeal submitAppeal(AppealRequest appealRequest) {
        User user = userRepository.findByUsername(appealRequest.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + appealRequest.getUsername()));

        // Optional check if user is actually inactive before allowing appeal?
        // if (user.isActive()) {
        //     throw new IllegalStateException("User account is already active.");
        // }

        Appeal appeal = new Appeal(user, appealRequest.getMessage());
        return appealRepository.save(appeal);
    }

    public List<Appeal> getAllAppeals() {
        return appealRepository.findAll();
    }

    public List<Appeal> getPendingAppeals() {
        return appealRepository.findByStatus(Appeal.AppealStatus.PENDING);
    }

    @Transactional
    public Appeal approveAppeal(Long appealId) {
        Appeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new ResourceNotFoundException("Appeal not found with ID: " + appealId));

        if (appeal.getStatus() != Appeal.AppealStatus.PENDING) {
            throw new IllegalStateException("Appeal is not in PENDING status.");
        }

        userService.activateUser(appeal.getUser().getId());

        appeal.setStatus(Appeal.AppealStatus.APPROVED);
        return appealRepository.save(appeal);
    }

    @Transactional
    public Appeal rejectAppeal(Long appealId) {
        Appeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new ResourceNotFoundException("Appeal not found with ID: " + appealId));

        if (appeal.getStatus() != Appeal.AppealStatus.PENDING) {
            throw new IllegalStateException("Appeal is not in PENDING status.");
        }

        appeal.setStatus(Appeal.AppealStatus.REJECTED);
        return appealRepository.save(appeal);
    }

    public Appeal getAppealById(Long appealId) {
        return appealRepository.findById(appealId)
                .orElseThrow(() -> new ResourceNotFoundException("Appeal not found with ID: " + appealId));
    }
}
