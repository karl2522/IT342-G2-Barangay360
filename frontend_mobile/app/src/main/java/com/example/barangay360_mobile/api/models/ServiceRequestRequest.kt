package com.example.barangay360_mobile.api.models

import com.google.gson.annotations.SerializedName

// Based on ServiceRequestRequest schema in swagger.json
data class ServiceRequestRequest(
    @SerializedName("userId") val userId: Long, // Required
    @SerializedName("serviceType") val serviceType: String, // Required
    @SerializedName("details") val details: String?, // Optional in JSON, but likely needed
    @SerializedName("purpose") val purpose: String?, // Optional
    @SerializedName("contactNumber") val contactNumber: String?, // Optional
    @SerializedName("address") val address: String?, // Optional
    @SerializedName("mode") val mode: String? = null // Made optional as requested
)