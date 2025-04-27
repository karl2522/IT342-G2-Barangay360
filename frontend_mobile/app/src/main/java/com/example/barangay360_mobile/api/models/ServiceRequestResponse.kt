package com.example.barangay360_mobile.api.models

import com.google.gson.annotations.SerializedName
import java.time.OffsetDateTime

// Based on ServiceRequestResponse schema in swagger.json
data class ServiceRequestResponse(
    @SerializedName("id") val id: Long?,
    @SerializedName("serviceType") val serviceType: String?,
    @SerializedName("status") val status: String?,
    @SerializedName("details") val details: String?,
    @SerializedName("purpose") val purpose: String?,
    @SerializedName("contactNumber") val contactNumber: String?,
    @SerializedName("address") val address: String?,
    @SerializedName("createdAt") val createdAt: OffsetDateTime?,
    @SerializedName("updatedAt") val updatedAt: OffsetDateTime?,
    @SerializedName("residentName") val residentName: String?,
    @SerializedName("residentEmail") val residentEmail: String?,
    @SerializedName("residentPhone") val residentPhone: String?
)