package com.example.barangay360_mobile.api

import com.example.barangay360_mobile.api.models.TokenRefreshRequest
import com.example.barangay360_mobile.util.SessionManager
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import java.net.HttpURLConnection

class TokenAuthenticator(
    private val sessionManager: SessionManager,
    private val authService: AuthService
) : Authenticator {
    
    override fun authenticate(route: Route?, response: Response): Request? {
        // Don't try to authenticate requests to the refresh token endpoint to avoid infinite loops
        if (response.request.url.toString().contains("refreshtoken")) {
            return null
        }

        // Check if we already tried to refresh the token for this request
        if (response.request.header("TOKEN_RETRY") != null) {
            return null // Give up if we already tried once
        }

        // Get the refresh token
        val refreshToken = sessionManager.fetchRefreshToken() ?: return null
        
        // Check if refresh token is expired
        if (sessionManager.isRefreshTokenExpired()) {
            return null // Can't refresh with expired refresh token
        }
        
        // Try to refresh the token
        val newToken = refreshToken(refreshToken)
        
        // If token refresh failed, give up
        if (newToken == null) {
            return null
        }
        
        // Create a new request with the new token
        return response.request.newBuilder()
            .header("Authorization", "Bearer $newToken")
            .header("TOKEN_RETRY", "true") // Mark this request as a retry
            .build()
    }
    
    private fun refreshToken(refreshToken: String): String? {
        return runBlocking {
            try {
                val response = authService.refreshToken(TokenRefreshRequest(refreshToken))
                
                if (response.isSuccessful && response.body() != null) {
                    val tokenResponse = response.body()!!
                    
                    // Save the new tokens
                    sessionManager.saveAuthToken(
                        tokenResponse.accessToken.token,
                        tokenResponse.accessToken.getExpirationTimestamp()
                    )
                    sessionManager.saveRefreshToken(
                        tokenResponse.refreshToken.token,
                        tokenResponse.refreshToken.getExpirationTimestamp()
                    )
                    
                    return@runBlocking tokenResponse.accessToken.token
                }
                
                return@runBlocking null
            } catch (e: Exception) {
                // Log the exception but don't crash
                e.printStackTrace()
                return@runBlocking null
            }
        }
    }
}