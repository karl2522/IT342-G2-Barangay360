package com.example.barangay360_mobile.util

import android.content.Context
import androidx.appcompat.app.AppCompatDelegate

/**
 * Utility class to manage the app's theme (light/dark mode)
 */
object ThemeManager {
    private const val PREFS_NAME = "barangay360_prefs"
    private const val KEY_DARK_MODE = "dark_mode"

    /**
     * Initialize theme based on saved preference
     */
    fun initialize(context: Context) {
        val isDarkMode = isDarkModeEnabled(context)
        applyTheme(isDarkMode)
    }

    /**
     * Toggle dark mode on/off and save preference
     */
    fun toggleDarkMode(context: Context, isDarkMode: Boolean) {
        saveThemePreference(context, isDarkMode)
        applyTheme(isDarkMode)
    }

    /**
     * Check if dark mode is currently enabled
     */
    fun isDarkModeEnabled(context: Context): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getBoolean(KEY_DARK_MODE, false)
    }

    /**
     * Apply the specified theme mode
     */
    private fun applyTheme(isDarkMode: Boolean) {
        val mode = if (isDarkMode) {
            AppCompatDelegate.MODE_NIGHT_YES
        } else {
            AppCompatDelegate.MODE_NIGHT_NO
        }
        AppCompatDelegate.setDefaultNightMode(mode)
    }

    /**
     * Save theme preference to SharedPreferences
     */
    private fun saveThemePreference(context: Context, isDarkMode: Boolean) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putBoolean(KEY_DARK_MODE, isDarkMode).apply()
    }
}