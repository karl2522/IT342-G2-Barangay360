package com.example.barangay360_mobile.api.models

data class SignUpRequest(
    val username: String,
    val email: String,
    val password: String,
    val firstName: String,
    val lastName: String,
    val address: String? = null,
    val phone: String? = null,
    val roles: Set<String>? = setOf("resident") // Default role for mobile users
)