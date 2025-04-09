package com.example.barangay360_mobile.api.models

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String
)

data class AuthResponse(
    val token: String,
    val user: User
)

data class User(
    val id: String,
    val name: String,
    val email: String
)