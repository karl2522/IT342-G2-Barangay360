package com.example.barangay360_mobile.api.models

data class SignInRequest(
    val username: String, // Spring Boot uses 'username' instead of 'email'
    val password: String
)