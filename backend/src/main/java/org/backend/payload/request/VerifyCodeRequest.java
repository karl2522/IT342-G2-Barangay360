package org.backend.payload.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyCodeRequest {
    @NotBlank(message = "Code is required")
    private String code;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    private String email;
} 