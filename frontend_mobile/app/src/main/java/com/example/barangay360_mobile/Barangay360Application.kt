package com.example.barangay360_mobile

import android.app.Application
import com.example.barangay360_mobile.api.ApiClient
import com.example.barangay360_mobile.util.SessionManager

class Barangay360Application : Application() {
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize SessionManager
        SessionManager.initialize(applicationContext)
        
        // Initialize API client
        ApiClient.init(applicationContext)
    }
}