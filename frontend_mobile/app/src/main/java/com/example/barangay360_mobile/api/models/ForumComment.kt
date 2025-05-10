// In a file like api/models/ForumComment.kt
package com.example.barangay360_mobile.api.models

import com.google.gson.annotations.SerializedName
import java.time.OffsetDateTime

data class ForumComment(
    @SerializedName("id") val id: Long,
    @SerializedName("content") val content: String,
    @SerializedName("author") val author: CommentAuthor?,
    @SerializedName("post") val post: PostStub?, // Include if your backend sends post info with comment
    @SerializedName("likes") var likes: List<UserLikeStub>?, // List of users who liked the comment
    @SerializedName("createdAt") val createdAt: OffsetDateTime?,
    @SerializedName("updatedAt") val updatedAt: OffsetDateTime?,
    @Transient var isLikedByCurrentUser: Boolean = false // Client-side state
) {
    val actualLikesCount: Int
        get() = likes?.size ?: 0
}

data class CommentAuthor(
    @SerializedName("id") val id: Long,
    @SerializedName("username") val username: String?,
    @SerializedName("firstName") val firstName: String?,
    @SerializedName("lastName") val lastName: String?
    // Add other fields like profileImage if available and needed
)

// You might already have UserLikeStub from CommunityPostResponse.kt
// data class UserLikeStub(
//    @SerializedName("id") val id: Long,
//    @SerializedName("username") val username: String?
// )

// A light version of ForumPost if comments contain post info
data class PostStub(
    @SerializedName("id") val id: Long,
    @SerializedName("title") val title: String?
)