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
import com.example.barangay360_mobile.api.models.SignInRequest
import com.example.barangay360_mobile.util.SessionManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext


class SignInActivity : AppCompatActivity() {

    private lateinit var emailEditText: EditText
    private lateinit var passwordEditText: EditText
    private lateinit var signInButton: Button
    private lateinit var signUpTextView: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.signin_page)

        sessionManager = SessionManager(this)

        // Check if user is already logged in
        if (sessionManager.isLoggedIn()) {
            navigateToHome()
            return
        }

        // Initialize views with correct IDs
        emailEditText = findViewById(R.id.signin_email)
        passwordEditText = findViewById(R.id.signin_password)
        signInButton = findViewById(R.id.signin_button)
        signUpTextView = findViewById(R.id.dont_have_account_signup_text)
        progressBar = findViewById(R.id.progressBar)

        signInButton.setOnClickListener {
            val email = emailEditText.text.toString().trim()
            val password = passwordEditText.text.toString().trim()

            if (validateInputs(email, password)) {
                loginUser(email, password)
            }
        }

        signUpTextView.setOnClickListener {
            startActivity(Intent(this, SignUpActivity::class.java))
        }
    }

    private fun validateInputs(email: String, password: String): Boolean {
        var isValid = true

        if (email.isEmpty()) {
            emailEditText.error = "Email is required"
            isValid = false
        }

        if (password.isEmpty()) {
            passwordEditText.error = "Password is required"
            isValid = false
        }

        return isValid
    }

    private fun loginUser(email: String, password: String) {
        showLoading(true)

        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Use email as username for Spring Boot
                val response = ApiClient.authService.login(SignInRequest(email, password))

                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        response.body()?.let { jwtResponse ->
                            // Save auth token and user details
                            sessionManager.saveAuthToken(jwtResponse.accessToken.token)
                            sessionManager.saveUserDetails(
                                jwtResponse.id.toString(),
                                "${jwtResponse.firstName} ${jwtResponse.lastName}",
                                jwtResponse.email
                            )

                            showLoading(false)
                            navigateToHome()
                        }
                    } else {
                        showLoading(false)
                        when (response.code()) {
                            401 -> showError("Invalid username or password")
                            403 -> showError("Account is disabled. Please submit an appeal.")
                            else -> showError("Login failed: ${response.message()}")
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
        signInButton.isEnabled = !isLoading
    }

    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    private fun navigateToHome() {
        startActivity(Intent(this, HomeActivity::class.java))
        finish()
    }
}