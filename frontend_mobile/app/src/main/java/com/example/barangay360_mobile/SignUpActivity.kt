package com.example.barangay360_mobile

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.barangay360_mobile.api.ApiClient
import com.example.barangay360_mobile.api.models.RegisterRequest
import com.example.barangay360_mobile.api.models.SignUpRequest
import com.example.barangay360_mobile.util.SessionManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class SignUpActivity : AppCompatActivity() {

    private lateinit var nameEditText: EditText
    private lateinit var emailEditText: EditText
    private lateinit var passwordEditText: EditText
    private lateinit var confirmPasswordEditText: EditText
    private lateinit var signUpButton: Button
    private lateinit var signInTextView: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.signup_page)

        sessionManager = SessionManager(this)

        // Initialize views with correct IDs
        nameEditText = findViewById(R.id.signup_name)
        emailEditText = findViewById(R.id.signup_email)
        passwordEditText = findViewById(R.id.signup_password)
        confirmPasswordEditText = findViewById(R.id.signup_confirmpassword)
        signUpButton = findViewById(R.id.signup_button)
        signInTextView = findViewById(R.id.already_account_signin_text)
        progressBar = findViewById(R.id.progressBar)

        // Set OnClickListener for sign up button
        signUpButton.setOnClickListener {
            val name = nameEditText.text.toString().trim()
            val email = emailEditText.text.toString().trim()
            val password = passwordEditText.text.toString().trim()
            val confirmPassword = confirmPasswordEditText.text.toString().trim()

            if (validateInputs(name, email, password, confirmPassword)) {
                registerUser(name, email, password)
            }
        }

        // Set OnClickListener for sign in text
        signInTextView.setOnClickListener {
            finish() // Go back to sign in
        }
    }

    private fun validateInputs(name: String, email: String, password: String, confirmPassword: String): Boolean {
        var isValid = true

        if (name.isEmpty()) {
            nameEditText.error = "Name is required"
            isValid = false
        }

        if (email.isEmpty()) {
            emailEditText.error = "Email is required"
            isValid = false
        } else if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            emailEditText.error = "Please enter a valid email"
            isValid = false
        }

        if (password.isEmpty()) {
            passwordEditText.error = "Password is required"
            isValid = false
        } else if (password.length < 6) {
            passwordEditText.error = "Password must be at least 6 characters"
            isValid = false
        }

        if (confirmPassword.isEmpty()) {
            confirmPasswordEditText.error = "Please confirm your password"
            isValid = false
        } else if (password != confirmPassword) {
            confirmPasswordEditText.error = "Passwords do not match"
            isValid = false
        }

        return isValid
    }

    private fun registerUser(name: String, email: String, password: String) {
        showLoading(true)

        // Split name into first and last name for Spring Boot
        val names = name.split(" ", limit = 2)
        val firstName = names[0]
        val lastName = if (names.size > 1) names[1] else ""

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = ApiClient.authService.register(
                    SignUpRequest(
                        username = email, // Using email as username
                        email = email,
                        password = password,
                        firstName = firstName,
                        lastName = lastName
                    )
                )

                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        showLoading(false)
                        // Show success message
                        showError("Registration successful. Please sign in.")
                        // Return to login screen
                        finish()
                    } else {
                        showLoading(false)
                        when (response.code()) {
                            400 -> showError("Username or email already in use")
                            else -> showError("Registration failed: ${response.message()}")
                        }
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    showLoading(false)
                    showError("Network error: ${e.message}")
                }
            }
        }
    }

    private fun showLoading(isLoading: Boolean) {
        progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        signUpButton.isEnabled = !isLoading
    }

    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    private fun navigateToHome() {
        startActivity(Intent(this, HomeActivity::class.java))
        finishAffinity() // Close all previous activities
    }
}