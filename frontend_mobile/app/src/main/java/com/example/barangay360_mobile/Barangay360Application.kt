package com.example.barangay360_mobile

import android.app.Application
import com.example.barangay360_mobile.api.ApiClient
import com.example.barangay360_mobile.util.ThemeManager

class Barangay360Application : Application() {
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize API client
        ApiClient.init(applicationContext)
        
        // Initialize theme
        ThemeManager.initialize(applicationContext)
    }
} 