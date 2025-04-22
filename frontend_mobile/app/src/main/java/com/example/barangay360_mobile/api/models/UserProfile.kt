package com.example.barangay360_mobile.api.models

data class UserProfile(
    val id: Long,
    val username: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val phone: String?,
    val address: String?,
    val bio: String?,
    val position: String?,  // For officials only
    val department: String?, // For officials only
    val active: Boolean,
    val profileImage: String?,
    val roles: List<Role>,
    val warnings: Int,
    val lastWarningDate: String?
)

data class Role(
    val id: Int,
    val name: String
) 