package com.example.barangay360_mobile.api

import com.example.barangay360_mobile.api.models.CommunityPostResponse
import com.example.barangay360_mobile.api.models.PageResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface CommunityFeedService {
    /**
     * Get all community posts with pagination
     */
    @GET("api/forum/posts")
    suspend fun getCommunityPosts(
        @Query("page") page: Int,
        @Query("size") size: Int
    ): Response<PageResponse<CommunityPostResponse>>

    /**
     * Toggle like for a forum post.
     * The backend is expected to return the updated ForumPost.
     */
    @POST("api/forum/posts/{postId}/like")
    suspend fun toggleLikePost(
        @Path("postId") postId: Long
    ): Response<CommunityPostResponse> // Assuming backend returns the updated post
}