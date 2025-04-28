package com.example.barangay360_mobile.api

import com.example.barangay360_mobile.api.models.UserProfile
import com.example.barangay360_mobile.api.models.UserUpdateRequest
import retrofit2.Response
import retrofit2.http.*

interface UserService {
    /**
     * Get the current user's profile information
     */
    @GET("api/users/{userId}")
    suspend fun getUserProfile(
        @Path("userId") userId: Long,
        @Header("Authorization") authHeader: String
    ): Response<UserProfile>

    /**
     * Update the user's profile information
     */
    @PUT("api/users/{id}")
    suspend fun updateUserProfile(
        @Path("id") userId: Long,
        @Body updateRequest: UserUpdateRequest
    ): Response<UserProfile>
}

