package org.backend.payload.request;

import jakarta.validation.constraints.NotNull;

public class LogoutRequest {
    @NotNull
    private Long userId;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
} 