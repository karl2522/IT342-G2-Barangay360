package com.example.barangay360_mobile.api.models

import com.google.gson.annotations.SerializedName
import java.time.Instant
import java.time.OffsetDateTime
import java.time.ZoneId

data class TokenDTO(
    @SerializedName("token")
    val token: String,
    
    @SerializedName("expiryDate")
    val expiryDate: OffsetDateTime? = null,
    
    @SerializedName("tokenType")
    val tokenType: String? = "Bearer",
    
    @SerializedName("issuedAt")
    val issuedAt: Instant? = null,
    
    @SerializedName("expiresAt")
    val expiresAt: Instant? = null,
    
    @SerializedName("issuer")
    val issuer: String? = null,
    
    @SerializedName("audience")
    val audience: String? = null
) {
    /**
     * Extracts the expiration timestamp in milliseconds from the token's expiry date
     * or falls back to a default expiration time if not available
     */
    fun getExpirationTimestamp(): Long {
        return when {
            expiresAt != null -> expiresAt.toEpochMilli()
            expiryDate != null -> expiryDate.toInstant().toEpochMilli()
            else -> System.currentTimeMillis() + (60 * 60 * 1000) // Default: 1 hour from now
        }
    }
}

data class TokenRefreshRequest(
    @SerializedName("refreshToken")
    val refreshToken: String
)

data class TokenRefreshResponse(
    @SerializedName("accessToken")
    val accessToken: TokenDTO,
    
    @SerializedName("refreshToken")
    val refreshToken: TokenDTO,
    
    @SerializedName("message")
    val message: String? = null
)