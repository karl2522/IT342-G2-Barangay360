package com.example.barangay360_mobile.api.models

data class JwtResponse(
    val accessToken: TokenDTO,
    val refreshToken: TokenDTO,
    val id: Long,
    val username: String,
    val email: String,
    val roles: List<String>,
    val firstName: String,
    val lastName: String,
    val phone: String?,
    val address: String?,
    val active: Boolean,
    val profileImage: String?
)

data class TokenDTO(
    val token: String,
    val expiryDuration: Long
)