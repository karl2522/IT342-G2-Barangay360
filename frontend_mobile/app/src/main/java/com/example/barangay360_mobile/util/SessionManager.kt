package com.example.barangay360_mobile.util

import android.content.Context
import android.content.SharedPreferences

class SessionManager(context: Context) {
    private var prefs: SharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    companion object {
        const val PREF_NAME = "Barangay360Prefs"
        const val USER_TOKEN = "user_token"
        const val USER_ID = "user_id"
        const val USER_NAME = "user_name"
        const val USER_EMAIL = "user_email"
        const val USER_FIRST_NAME = "user_first_name"
        const val USER_LAST_NAME = "user_last_name"
        const val USER_ROLES = "user_roles"
        const val USER_PHONE = "user_phone"
        const val USER_ADDRESS = "user_address"
        const val USER_IS_ACTIVE = "user_is_active"
        const val USER_WARNINGS = "user_warnings"
    }

    fun saveAuthToken(token: String) {
        val editor = prefs.edit()
        editor.putString(USER_TOKEN, token)
        editor.apply()
    }

    fun saveUserDetails(
        id: String,
        firstName: String,
        lastName: String,
        email: String,
        roles: List<String>,
        phone: String?,
        address: String?,
        isActive: Boolean,
        warnings: Int
    ) {
        val editor = prefs.edit()
        editor.putString(USER_ID, id)
        editor.putString(USER_FIRST_NAME, firstName)
        editor.putString(USER_LAST_NAME, lastName)
        editor.putString(USER_EMAIL, email)
        editor.putString(USER_PHONE, phone)
        editor.putString(USER_ADDRESS, address)
        editor.putBoolean(USER_IS_ACTIVE, isActive)
        editor.putInt(USER_WARNINGS, warnings)
        editor.putStringSet(USER_ROLES, roles.toSet())
        editor.apply()
    }

    fun getAuthToken(): String? {
        return prefs.getString(USER_TOKEN, null)
    }

    fun getUserName(): String? {
        return prefs.getString(USER_NAME, null)
    }

    fun getFirstName(): String? {
        return prefs.getString(USER_FIRST_NAME, null)
    }

    fun getLastName(): String? {
        return prefs.getString(USER_LAST_NAME, null)
    }

    fun getUserEmail(): String? {
        return prefs.getString(USER_EMAIL, null)
    }

    fun getUserRoles(): Set<String>? {
        return prefs.getStringSet(USER_ROLES, null)
    }

    fun getUserId(): Long? {
        val idString = prefs.getString(USER_ID, null)
        return idString?.toLongOrNull()
    }

    fun clearSession() {
        val editor = prefs.edit()
        editor.clear()
        editor.apply()
    }

    fun isLoggedIn(): Boolean {
        return getAuthToken() != null
    }
}