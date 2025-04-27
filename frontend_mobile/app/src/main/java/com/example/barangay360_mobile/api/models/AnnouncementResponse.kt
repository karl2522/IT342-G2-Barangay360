package com.example.barangay360_mobile.api.models

import com.google.gson.annotations.SerializedName
import java.time.OffsetDateTime // Use OffsetDateTime for proper timezone handling

data class AnnouncementResponse(
    @SerializedName("id") val id: Long?,
    @SerializedName("title") val title: String?,
    @SerializedName("content") val content: String?,
    @SerializedName("thumbnailUrl") val thumbnailUrl: String?,
    @SerializedName("createdAt") val createdAt: OffsetDateTime?, // Changed to OffsetDateTime
    @SerializedName("updatedAt") val updatedAt: OffsetDateTime?, // Changed to OffsetDateTime
    @SerializedName("officialId") val officialId: Long?,
    @SerializedName("officialName") val officialName: String?
)