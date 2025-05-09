package com.example.barangay360_mobile.api

import com.example.barangay360_mobile.api.models.CommunityPostResponse
import com.example.barangay360_mobile.api.models.PageResponse // Import PageResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Query

interface CommunityFeedService {
    /**
     * Get all community posts with pagination
     */
    @GET("api/forum/posts") // Corrected endpoint
    suspend fun getCommunityPosts(
        @Query("page") page: Int,
        @Query("size") size: Int
    ): Response<PageResponse<CommunityPostResponse>> // Updated response type
}