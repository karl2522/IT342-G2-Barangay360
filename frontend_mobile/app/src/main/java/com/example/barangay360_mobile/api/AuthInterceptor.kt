package com.example.barangay360_mobile.api

import com.example.barangay360_mobile.util.SessionManager
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(private val sessionManager: SessionManager) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val requestBuilder = chain.request().newBuilder()
        
        // Get the token from session manager
        sessionManager.getAuthToken()?.let { token ->
            // Add the token as Bearer token in Authorization header
            requestBuilder.addHeader("Authorization", "Bearer $token")
        }
        
        return chain.proceed(requestBuilder.build())
    }
}