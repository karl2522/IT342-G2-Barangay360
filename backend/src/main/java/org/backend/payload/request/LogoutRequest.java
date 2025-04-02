package org.backend.payload.request;

import jakarta.validation.constraints.NotNull;

public class LogoutRequest {
    @NotNull(message = "Access token cannot be null")
    private String accessToken;

    @NotNull(message = "Refresh token cannot be null")
    private String refreshToken;

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}
