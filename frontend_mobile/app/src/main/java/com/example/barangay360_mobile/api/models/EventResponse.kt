package com.example.barangay360_mobile.api.models

import com.google.gson.annotations.SerializedName
import java.time.LocalDateTime

data class EventResponse(
    @SerializedName("id") val id: Long,
    @SerializedName("title") val title: String?,
    @SerializedName("description") val description: String?,
    @SerializedName("location") val location: String?,
    @SerializedName("start") val start: LocalDateTime?,
    @SerializedName("end") val end: LocalDateTime?,
    @SerializedName("allDay") val allDay: Boolean = false,
    @SerializedName("color") val color: String? // This will be used for the top border
)