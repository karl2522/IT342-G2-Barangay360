package com.example.barangay360_mobile

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import android.widget.Button
import com.example.barangay360_mobile.R
import android.widget.TextView

class SignInActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.signin_page)

        // Find the TextView by ID
        val signInTextView: TextView = findViewById(R.id.dont_have_account_signup_text)

        // Set an OnClickListener to navigate to the SignIn page
        signInTextView.setOnClickListener {
            val intent = Intent(this, SignUpActivity::class.java)
            startActivity(intent)
        }

        // New: Set up Sign Up button to go to HomePage
        val signInButton: Button = findViewById(R.id.signin_button)
        signInButton.setOnClickListener {
            val intent = Intent(this, HomeActivity::class.java)
            startActivity(intent)
        }
    }
}
