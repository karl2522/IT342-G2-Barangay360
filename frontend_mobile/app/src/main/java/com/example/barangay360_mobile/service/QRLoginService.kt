package com.example.barangay360_mobile.service

import com.example.barangay360_mobile.api.models.JwtResponse
import retrofit2.Response
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Query

interface QRLoginService {
    @POST("api/auth/qr/confirm")
    suspend fun confirmQRLogin(
        @Header("Authorization") authHeader: String,
        @Query("sessionId") sessionId: String
    ): Response<JwtResponse>
}