package com.example.barangay360_mobile.api.models

data class UserUpdateRequest(
    val firstName: String?,
    val lastName: String?,
    val phone: String?,
    val address: String?,
    val bio: String?,
)