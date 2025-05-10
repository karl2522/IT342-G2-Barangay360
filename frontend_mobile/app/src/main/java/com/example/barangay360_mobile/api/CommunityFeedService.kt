package com.example.barangay360_mobile.api

import com.example.barangay360_mobile.api.models.CommunityPostResponse
import com.example.barangay360_mobile.api.models.PageResponse
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Path
import retrofit2.http.Query

interface CommunityFeedService {
    // ... getCommunityPosts method ...

    @GET("api/forum/posts") // Keep this
    suspend fun getCommunityPosts(
        @Query("page") page: Int,
        @Query("size") size: Int
    ): Response<PageResponse<CommunityPostResponse>>

    @POST("api/forum/posts/{postId}/like") // Keep this
    suspend fun toggleLikePost(
        @Path("postId") postId: Long
    ): Response<CommunityPostResponse>

    @Multipart
    @POST("api/forum/posts")
    suspend fun createPost(
        @Part("title") title: RequestBody,
        @Part("content") content: RequestBody,
        @Part image: MultipartBody.Part? // Nullable for optional image
    ): Response<CommunityPostResponse> // Assuming backend returns the created post
}