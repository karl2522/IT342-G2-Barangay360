package com.example.barangay360_mobile.api

import com.example.barangay360_mobile.api.models.ServiceRequestRequest
import com.example.barangay360_mobile.api.models.ServiceRequestResponse
import retrofit2.Response
import retrofit2.http.*

interface ServiceRequestService {

    /**
     * Create a new service request
     * Corresponds to POST /api/service-requests in swagger.json
     */
    @POST("api/service-requests")
    suspend fun createServiceRequest(
        @Body request: ServiceRequestRequest
    ): Response<ServiceRequestResponse> // Or use a generic Response<ResponseBody> if you don't need the response body

    /**
     * Get service requests for a specific user
     * Corresponds to GET /api/service-requests/user/{userId} in swagger.json
     */
    @GET("api/service-requests/user/{userId}")
    suspend fun getServiceRequestsByUserId(
        @Path("userId") userId: Long
    ): Response<List<ServiceRequestResponse>> // Expecting a List
}