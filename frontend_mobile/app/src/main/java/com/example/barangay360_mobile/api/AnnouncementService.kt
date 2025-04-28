package com.example.barangay360_mobile.api

import com.example.barangay360_mobile.api.models.AnnouncementResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header

interface AnnouncementService {
    /**
     * Get all announcements
     * Corresponds to GET /api/announcements in swagger.json
     */
    @GET("api/announcements")
    suspend fun getAnnouncements(
        @Header("Authorization") authHeader: String // Assuming announcements might require auth
    ): Response<List<AnnouncementResponse>> // Expecting a List
}