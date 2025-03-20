package org.backend.payload.response;

public class TokenRefreshResponse {
    private TokenDTO accessToken;
    private TokenDTO refreshToken;
    private String message;

    public TokenRefreshResponse(TokenDTO accessToken, TokenDTO refreshToken, String message) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.message = message;
    }

    public TokenDTO getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(TokenDTO accessToken) {
        this.accessToken = accessToken;
    }

    public TokenDTO getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(TokenDTO refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
} 