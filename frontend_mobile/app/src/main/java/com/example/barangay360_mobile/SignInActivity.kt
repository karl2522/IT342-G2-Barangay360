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

    private lateinit var usernameEditText: EditText
    private lateinit var passwordEditText: EditText
    private lateinit var signInButton: Button
    private lateinit var signUpTextView: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.signin_page)

        // Initialize SessionManager and ApiClient
        sessionManager = SessionManager(this)
        ApiClient.init(applicationContext)

        // Check if user is already logged in
        if (sessionManager.isLoggedIn()) {
            navigateToHome()
            return
        }

        // Initialize views with correct IDs
        usernameEditText = findViewById(R.id.signin_email)
        passwordEditText = findViewById(R.id.signin_password)
        signInButton = findViewById(R.id.signin_button)
        signUpTextView = findViewById(R.id.dont_have_account_signup_text)
        progressBar = findViewById(R.id.progressBar)

        signInButton.setOnClickListener {
            val username = usernameEditText.text.toString().trim()
            val password = passwordEditText.text.toString().trim()

            if (validateInputs(username, password)) {
                loginUser(username, password)
            }
        }

        signUpTextView.setOnClickListener {
            startActivity(Intent(this, SignUpActivity::class.java))
        }
    }

    private fun validateInputs(username: String, password: String): Boolean {
        var isValid = true

        // Username validation
        if (username.isEmpty()) {
            usernameEditText.error = "Username is required"
            isValid = false
        } else if (username.length < 3 || username.length > 20) {
            usernameEditText.error = "Username must be between 3 and 20 characters"
            isValid = false
        }

        // Password validation
        if (password.isEmpty()) {
            passwordEditText.error = "Password is required"
            isValid = false
        } else if (password.length < 6) {
            passwordEditText.error = "Password must be at least 6 characters"
            isValid = false
        } else if (password.length > 40) {
            passwordEditText.error = "Password must be less than 40 characters"
            isValid = false
        }

        return isValid
    }

    private fun loginUser(username: String, password: String) {
        showLoading(true)

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = ApiClient.authService.login(SignInRequest(username, password))

                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        response.body()?.let { jwtResponse ->
                            // Save auth token and user details
                            sessionManager.saveAuthToken(jwtResponse.accessToken.token)
                            sessionManager.saveUserDetails(
                                jwtResponse.id.toString(),
                                jwtResponse.firstName,
                                jwtResponse.lastName,
                                jwtResponse.email,
                                jwtResponse.roles,
                                jwtResponse.address,
                                jwtResponse.phone,
                                jwtResponse.active,
                                jwtResponse.warnings,
                            )

                            showLoading(false)
                            navigateToHome()
                        } ?: run {
                            showLoading(false)
                            showError("Invalid response from server")
                        }
                    } else {
                        showLoading(false)
                        when (response.code()) {
                            401 -> showError("Invalid username or password")
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
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }

    private fun navigateToHome() {
        val intent = Intent(this, HomeActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}