package org.backend.payload.response;

import java.time.Instant;

public class TokenDTO {
    private String token;
    private String tokenType;
    private Instant issuedAt;
    private Instant expiresAt;
    private String issuer;
    private String audience;

    public TokenDTO(String token, String tokenType, Instant issuedAt, Instant expiresAt, String issuer, String audience) {
        this.token = token;
        this.tokenType = tokenType;
        this.issuedAt = issuedAt;
        this.expiresAt = expiresAt;
        this.issuer = issuer;
        this.audience = audience;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public Instant getIssuedAt() {
        return issuedAt;
    }

    public void setIssuedAt(Instant issuedAt) {
        this.issuedAt = issuedAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }

    public String getAudience() {
        return audience;
    }

    public void setAudience(String audience) {
        this.audience = audience;
    }

    public long getExpiresIn() {
        return expiresAt.getEpochSecond() - Instant.now().getEpochSecond();
    }
} 