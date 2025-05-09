package com.example.barangay360_mobile.api.models

import com.google.gson.annotations.SerializedName
import java.time.OffsetDateTime

// Represents a user who liked the post - can be simple if you only need the count
data class UserLikeStub(
    @SerializedName("id") val id: Long
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
    @SerializedName("comments") val comments: List<CommentStub>?, // To get comments.size
    @SerializedName("likes") val likes: List<UserLikeStub>?,       // To get likes.size
    @SerializedName("createdAt") val createdAt: OffsetDateTime?,
    @SerializedName("updatedAt") val updatedAt: OffsetDateTime?
    // reports field is ignored for now unless needed
)

data class Author(
    @SerializedName("id") val id: Long,
    @SerializedName("username") val username: String?,
    @SerializedName("firstName") val firstName: String?,
    @SerializedName("lastName") val lastName: String?,
    @SerializedName("address") val address: String?, // Added from JSON
    @SerializedName("phone") val phone: String?,     // Added from JSON
    @SerializedName("createdAt") val createdAt: OffsetDateTime?, // Added from JSON
    @SerializedName("warnings") val warnings: Int?,             // Added from JSON
    @SerializedName("lastWarningDate") val lastWarningDate: OffsetDateTime?, // Added from JSON
    @SerializedName("active") val active: Boolean?,             // Added from JSON
    @SerializedName("profileImage") val profileImage: String? // Assuming this maps to a URL
)