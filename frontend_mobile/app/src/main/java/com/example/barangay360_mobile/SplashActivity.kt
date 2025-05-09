package com.example.barangay360_mobile

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.animation.AnimationUtils
import android.widget.ImageView
import androidx.appcompat.app.AppCompatActivity

class SplashActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        // Find the logo and text ImageViews
        val logoImage = findViewById<ImageView>(R.id.logo)
        val logoText = findViewById<ImageView>(R.id.logo_text)

        // Load animations
        val fadeInLogo = AnimationUtils.loadAnimation(this, R.anim.fade_in_logo)
        val fadeInText = AnimationUtils.loadAnimation(this, R.anim.fade_in_text)

        // Apply animations
        logoImage.startAnimation(fadeInLogo)
        logoText.startAnimation(fadeInText)

        // Delay for splash screen - waiting for animations to complete
        // Logo takes 1500ms, text has 1500ms offset and takes 1500ms = total 3000ms
        // Adding a small buffer of 500ms
        Handler(Looper.getMainLooper()).postDelayed({
            // Check authentication status
            checkAuthStatus()
        }, 3500)
    }

    private fun checkAuthStatus() {
        // Determine where to navigate based on authentication
        try {
            // Check if user is logged in using your SessionManager
            if (isLoggedIn()) {
                startActivity(Intent(this, HomeActivity::class.java))
            } else {
                startActivity(Intent(this, SignInActivity::class.java))
            }
        } catch (e: Exception) {
            // If there's any error, default to sign in
            startActivity(Intent(this, SignInActivity::class.java))
        } finally {
            finish()
        }
    }

    private fun isLoggedIn(): Boolean {
        // Replace this with your actual authentication check
        // For example: return SessionManager.getInstance().isLoggedIn()
        return false
    }
}
