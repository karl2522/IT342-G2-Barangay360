package com.example.barangay360_mobile.api

import com.example.barangay360_mobile.api.models.ServiceRequestRequest
import com.example.barangay360_mobile.api.models.ServiceRequestResponse // Assuming you created this
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path

interface ServiceRequestService {

    /**
     * Create a new service request
     * Corresponds to POST /api/service-requests in swagger.json
     */
    @POST("api/service-requests")
    suspend fun createServiceRequest(
        @Header("Authorization") authHeader: String,
        @Body request: ServiceRequestRequest
    ): Response<ServiceRequestResponse> // Or use a generic Response<ResponseBody> if you don't need the response body

    /**
     * Get service requests for a specific user
     * Corresponds to GET /api/service-requests/user/{userId} in swagger.json
     */
    @GET("api/service-requests/user/{userId}")
    suspend fun getServiceRequestsByUserId(
        @Header("Authorization") authHeader: String,
        @Path("userId") userId: Long
    ): Response<List<ServiceRequestResponse>> // Expecting a List
}