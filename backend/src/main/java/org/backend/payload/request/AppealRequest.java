package org.backend.payload.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AppealRequest {
    @NotBlank
    private String username;

    @NotBlank
    private String message;
}