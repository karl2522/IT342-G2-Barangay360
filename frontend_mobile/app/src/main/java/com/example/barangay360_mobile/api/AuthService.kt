package com.example.barangay360_mobile.api

import com.example.barangay360_mobile.api.models.JwtResponse
import com.example.barangay360_mobile.api.models.SignInRequest
import com.example.barangay360_mobile.api.models.MessageResponse
import com.example.barangay360_mobile.api.models.SignUpRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthService {
    @POST("api/auth/signin")
    suspend fun login(@Body request: SignInRequest): Response<JwtResponse>

    @POST("api/auth/signup")
    suspend fun register(@Body request: SignUpRequest): Response<MessageResponse>
}