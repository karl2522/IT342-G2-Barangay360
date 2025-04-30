package com.example.barangay360_mobile

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.animation.AnimationUtils
import android.widget.ImageView
import androidx.appcompat.app.AppCompatActivity
import com.example.barangay360_mobile.util.SessionManager
import com.example.barangay360_mobile.api.ApiClient
import kotlinx.coroutines.launch

class SplashActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        // Delay for splash screen visibility
        Handler(Looper.getMainLooper()).postDelayed({
            // No need to initialize here, it's done in Application class
            // SessionManager.initialize(applicationContext)
            // ApiClient.init(applicationContext)

            // Check login status after delay
            checkLoginStatus()
        }, 2000) // 2 seconds delay
    }

    private fun checkLoginStatus() {
        try {
            // Check if user is logged in
            if (SessionManager.getInstance().isLoggedIn()) {
                // Go to home screen if logged in
                val mainIntent = Intent(this@SplashActivity, HomeActivity::class.java)
                startActivity(mainIntent)
            } else {
                // Go to sign in screen if not logged in
                val mainIntent = Intent(this@SplashActivity, SignInActivity::class.java)
                startActivity(mainIntent)
            }
        } catch (e: Exception) {
            // If there's any error, default to sign in
            val mainIntent = Intent(this@SplashActivity, SignInActivity::class.java)
            startActivity(mainIntent)
        } finally {
            finish()
        }
    }
}