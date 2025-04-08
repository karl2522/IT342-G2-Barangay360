package org.backend.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.backend.model.Appeal;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppealResponse {
    private Long id;
    private String username;
    private String message;
    private Appeal.AppealStatus status;
    private LocalDateTime appealDate;
    // Add user details if needed, e.g., user's full name
    // private String userFullName;

    public static AppealResponse fromAppeal(Appeal appeal) {
        return new AppealResponse(
                appeal.getId(),
                appeal.getUsername(),
                appeal.getMessage(),
                appeal.getStatus(),
                appeal.getAppealDate()
                // Populate additional fields if added
        );
    }
}