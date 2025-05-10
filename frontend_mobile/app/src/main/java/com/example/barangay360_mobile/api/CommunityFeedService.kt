package com.example.barangay360_mobile.api

import com.example.barangay360_mobile.api.models.CommunityPostResponse
import com.example.barangay360_mobile.api.models.ForumComment // Your ForumComment model
import com.example.barangay360_mobile.api.models.PageResponse // Still needed for posts
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface CommunityFeedService {

    @GET("api/forum/posts")
    suspend fun getCommunityPosts(
        @Query("page") page: Int,
        @Query("size") size: Int
    ): Response<PageResponse<CommunityPostResponse>>

    @POST("api/forum/posts/{postId}/like")
    suspend fun toggleLikePost(
        @Path("postId") postId: Long
    ): Response<CommunityPostResponse>

    @Multipart
    @POST("api/forum/posts")
    suspend fun createPost(
        @Part("title") title: RequestBody,
        @Part("content") content: RequestBody,
        @Part image: MultipartBody.Part?
    ): Response<CommunityPostResponse>

    // --- MODIFIED FOR COMMENTS ---
    @GET("api/forum/posts/{postId}/comments")
    suspend fun getCommentsForPost(
        @Path("postId") postId: Long,
        // If the backend ignores these for a direct list, they might not be necessary,
        // but keeping them for now if backend does some basic limit/offset without full pagination.
        @Query("page") page: Int, // Or remove if backend doesn't use it for direct list
        @Query("size") size: Int  // Or remove if backend doesn't use it for direct list
    ): Response<List<ForumComment>> // <--- CHANGED FROM PageResponse<ForumComment>

    @POST("api/forum/posts/{postId}/comments")
    @FormUrlEncoded
    suspend fun createComment(
        @Path("postId") postId: Long,
        @Field("content") content: String
    ): Response<ForumComment>

    @POST("api/forum/comments/{commentId}/like")
    suspend fun toggleLikeComment(
        @Path("commentId") commentId: Long
    ): Response<ForumComment>
}