package com.example.barangay360_mobile

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.animation.AnimationUtils
import android.widget.ImageView
import androidx.appcompat.app.AppCompatActivity
import com.example.barangay360_mobile.util.SessionManager


@SuppressLint("CustomSplashScreen")
class SplashActivity : AppCompatActivity() {

    private val SPLASH_DISPLAY_LENGTH = 4000L // Duration in milliseconds
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        // Initialize session manager
        sessionManager = SessionManager(this)

        // Load animations
        val fadeInLogo = AnimationUtils.loadAnimation(this, R.anim.fade_in_logo)
        val fadeInText = AnimationUtils.loadAnimation(this, R.anim.fade_in_text)

        // Start animations
        findViewById<ImageView>(R.id.logo).startAnimation(fadeInLogo)
        findViewById<ImageView>(R.id.logo_text).startAnimation(fadeInText)

        Handler(Looper.getMainLooper()).postDelayed({
            // Check if user is logged in
            if (sessionManager.isLoggedIn()) {
                // Go to home screen if logged in
                val mainIntent = Intent(this@SplashActivity, HomeActivity::class.java)
                startActivity(mainIntent)
            } else {
                // Go to sign in screen if not logged in
                val mainIntent = Intent(this@SplashActivity, SignInActivity::class.java)
                startActivity(mainIntent)
            }
            finish()
        }, SPLASH_DISPLAY_LENGTH)
    }
}