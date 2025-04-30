package com.example.barangay360_mobile.api

import com.example.barangay360_mobile.api.models.AnnouncementResponse
import retrofit2.Response
import retrofit2.http.GET

interface AnnouncementService {
    /**
     * Get all announcements
     * Corresponds to GET /api/announcements in swagger.json
     */
    @GET("api/announcements")
    suspend fun getAnnouncements(
    ): Response<List<AnnouncementResponse>> // Expecting a List
}