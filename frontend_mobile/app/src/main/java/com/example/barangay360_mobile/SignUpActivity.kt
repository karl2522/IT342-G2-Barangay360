package com.example.barangay360_mobile

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import com.example.barangay360_mobile.R
import android.widget.TextView

class SignUpActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.signup_page)

        // Find the TextView by ID
        val signInTextView: TextView = findViewById(R.id.already_account_signin_text)

        // Set an OnClickListener to navigate to the SignIn page
        signInTextView.setOnClickListener {
            val intent = Intent(this, SignInActivity::class.java)
            startActivity(intent)
        }

        // New: Set up Sign Up button to go to HomePage
        val signUpButton: Button = findViewById(R.id.signup_button)
        signUpButton.setOnClickListener {
            val intent = Intent(this, HomeActivity::class.java)
            startActivity(intent)
        }
    }
}
