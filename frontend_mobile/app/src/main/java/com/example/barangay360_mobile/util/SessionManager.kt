package com.example.barangay360_mobile.util

import android.content.Context
import android.content.SharedPreferences
import java.util.Date

class SessionManager private constructor(context: Context) {
    private var prefs: SharedPreferences = context.getSharedPreferences("Barangay360Prefs", Context.MODE_PRIVATE)

    companion object {
        private var instance: SessionManager? = null

        const val USER_TOKEN = "user_token"
        const val TOKEN_EXPIRY = "token_expiry"
        const val REFRESH_TOKEN = "refresh_token"
        const val REFRESH_TOKEN_EXPIRY = "refresh_token_expiry"
        const val USER_ID = "user_id"
        const val FIRST_NAME = "first_name"
        const val LAST_NAME = "last_name"
        const val EMAIL = "email"
        const val ROLES = "roles"
        const val ADDRESS = "address"
        const val PHONE = "phone"
        const val IS_ACTIVE = "is_active"
        const val WARNINGS = "warnings"

        fun initialize(context: Context) {
            if (instance == null) {
                instance = SessionManager(context.applicationContext)
            }
        }

        fun getInstance(): SessionManager {
            return instance ?: throw IllegalStateException("SessionManager must be initialized first")
        }
    }

    fun saveAuthToken(token: String, expiryTimestamp: Long) {
        val editor = prefs.edit()
        editor.putString(USER_TOKEN, token)
        editor.putLong(TOKEN_EXPIRY, expiryTimestamp)
        editor.apply()
    }

    fun saveRefreshToken(token: String, expiryTimestamp: Long) {
        val editor = prefs.edit()
        editor.putString(REFRESH_TOKEN, token)
        editor.putLong(REFRESH_TOKEN_EXPIRY, expiryTimestamp)
        editor.apply()
    }

    fun fetchAuthToken(): String? {
        return prefs.getString(USER_TOKEN, null)
    }

    fun getAuthToken(): String? {
        return fetchAuthToken()
    }

    fun getTokenExpiry(): Long {
        return prefs.getLong(TOKEN_EXPIRY, 0)
    }

    fun isTokenExpired(): Boolean {
        val expiryTime = getTokenExpiry()
        if (expiryTime == 0L) return true
        return System.currentTimeMillis() >= expiryTime
    }

    fun fetchRefreshToken(): String? {
        return prefs.getString(REFRESH_TOKEN, null)
    }

    fun getRefreshTokenExpiry(): Long {
        return prefs.getLong(REFRESH_TOKEN_EXPIRY, 0)
    }

    fun isRefreshTokenExpired(): Boolean {
        val expiryTime = getRefreshTokenExpiry()
        if (expiryTime == 0L) return true
        return System.currentTimeMillis() >= expiryTime
    }

    fun saveUserDetails(
        userId: String,
        firstName: String,
        lastName: String,
        email: String,
        roles: List<String>,
        address: String?,
        phone: String?,
        isActive: Boolean,
        warnings: Int
    ) {
        val editor = prefs.edit()
        editor.putString(USER_ID, userId)
        editor.putString(FIRST_NAME, firstName)
        editor.putString(LAST_NAME, lastName)
        editor.putString(EMAIL, email)
        editor.putString(ROLES, roles.joinToString(","))
        editor.putString(ADDRESS, address)
        editor.putString(PHONE, phone)
        editor.putBoolean(IS_ACTIVE, isActive)
        editor.putInt(WARNINGS, warnings)
        editor.apply()
    }

    fun clearSession() {
        val editor = prefs.edit()
        editor.clear()
        editor.apply()
    }

    fun isLoggedIn(): Boolean {
        return fetchAuthToken() != null
    }
    
    // Getter methods for user details
    fun getFirstName(): String? {
        return prefs.getString(FIRST_NAME, null)
    }
    
    fun getLastName(): String? {
        return prefs.getString(LAST_NAME, null)
    }
    
    fun getUserEmail(): String? {
        return prefs.getString(EMAIL, null)
    }
    
    fun getUserId(): String? {
        return prefs.getString(USER_ID, null)
    }
    
    fun getUserRoles(): List<String> {
        val rolesString = prefs.getString(ROLES, "")
        return if (rolesString.isNullOrEmpty()) {
            emptyList()
        } else {
            rolesString.split(",")
        }
    }
    
    fun getAddress(): String? {
        return prefs.getString(ADDRESS, null)
    }
    
    fun getPhone(): String? {
        return prefs.getString(PHONE, null)
    }
    
    fun isActive(): Boolean {
        return prefs.getBoolean(IS_ACTIVE, true)
    }
    
    fun getWarnings(): Int {
        return prefs.getInt(WARNINGS, 0)
    }
}