package com.example.barangay360_mobile.api.models

import com.google.gson.annotations.SerializedName
import java.time.OffsetDateTime

// Represents a user who liked the post - ensure 'id' matches your backend JSON for a user in the likes list
data class UserLikeStub(
    @SerializedName("id") val id: Long,
    @SerializedName("username") val username: String? // Optional, if backend sends it in likes list
    // Add other user fields if your 'likes' array contains full user objects and you need them
)

// Represents a comment stub - can be simple if you only need the count
data class CommentStub(
    @SerializedName("id") val id: Long
    // Add other comment fields if needed for other purposes
)

data class CommunityPostResponse(
    @SerializedName("id") val id: Long,
    @SerializedName("title") val title: String?,
    @SerializedName("content") val content: String?,
    @SerializedName("imageUrl") val imageUrl: String?,
    @SerializedName("author") val author: Author?,
    @SerializedName("comments") var comments: List<CommentStub>?, // Made var to potentially update count
    @SerializedName("likes") var likes: List<UserLikeStub>?,       // Made var to update list/count
    @SerializedName("createdAt") val createdAt: OffsetDateTime?,
    @SerializedName("updatedAt") val updatedAt: OffsetDateTime?,

    // This field is NOT from JSON, it will be set by the client
    @Transient var isLikedByCurrentUser: Boolean = false
) {
    // Helper to get a consistent like count
    val actualLikesCount: Int
        get() = likes?.size ?: 0
    // Helper to get a consistent comment count
    val actualCommentsCount: Int
        get() = comments?.size ?: 0
}


data class Author(
    @SerializedName("id") val id: Long,
    @SerializedName("username") val username: String?,
    @SerializedName("firstName") val firstName: String?,
    @SerializedName("lastName") val lastName: String?,
    @SerializedName("address") val address: String?,
    @SerializedName("phone") val phone: String?,
    @SerializedName("createdAt") val createdAt: OffsetDateTime?,
    @SerializedName("warnings") val warnings: Int?,
    @SerializedName("lastWarningDate") val lastWarningDate: OffsetDateTime?,
    @SerializedName("active") val active: Boolean?,
    @SerializedName("profileImage") val profileImage: String?
)