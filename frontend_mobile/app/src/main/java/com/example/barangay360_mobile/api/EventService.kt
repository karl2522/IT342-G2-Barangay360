package com.example.barangay360_mobile.api

import com.example.barangay360_mobile.api.models.EventResponse
import retrofit2.Response
import retrofit2.http.GET

interface EventService {
    @GET("api/events")
    suspend fun getAllEvents(): Response<List<EventResponse>>
}