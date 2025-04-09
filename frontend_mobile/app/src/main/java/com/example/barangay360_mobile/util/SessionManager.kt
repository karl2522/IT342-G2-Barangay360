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
    }

    fun saveAuthToken(token: String) {
        val editor = prefs.edit()
        editor.putString(USER_TOKEN, token)
        editor.apply()
    }

    fun saveUserDetails(id: String, name: String, email: String) {
        val editor = prefs.edit()
        editor.putString(USER_ID, id)
        editor.putString(USER_NAME, name)
        editor.putString(USER_EMAIL, email)
        editor.apply()
    }

    fun getAuthToken(): String? {
        return prefs.getString(USER_TOKEN, null)
    }

    fun getUserName(): String? {
        return prefs.getString(USER_NAME, null)
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