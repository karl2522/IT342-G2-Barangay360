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
import com.example.barangay360_mobile.api.models.SignUpRequest
import com.example.barangay360_mobile.util.SessionManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class SignUpActivity : AppCompatActivity() {

    private lateinit var firstNameEditText: EditText
    private lateinit var lastNameEditText: EditText
    private lateinit var usernameEditText: EditText
    private lateinit var emailEditText: EditText
    private lateinit var passwordEditText: EditText
    private lateinit var addressEditText: EditText
    private lateinit var phoneEditText: EditText
    private lateinit var signUpButton: Button
    private lateinit var signInTextView: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.signup_page)

        sessionManager = SessionManager.getInstance();

        // Initialize views with correct IDs
        firstNameEditText = findViewById(R.id.signup_firstname)
        lastNameEditText = findViewById(R.id.signup_lastname)
        usernameEditText = findViewById(R.id.signup_username)
        emailEditText = findViewById(R.id.signup_email)
        passwordEditText = findViewById(R.id.signup_password)
        addressEditText = findViewById(R.id.signup_address)
        phoneEditText = findViewById(R.id.signup_phone)
        signUpButton = findViewById(R.id.signup_button)
        // Correct the ID reference for the sign-in text view
        signInTextView = findViewById(R.id.already_account_signin_text) 
        progressBar = findViewById(R.id.progressBar)

        // No need to initialize here, it's done in Application class
        // ApiClient.init(applicationContext)

        signUpButton.setOnClickListener {
            val firstName = firstNameEditText.text.toString().trim()
            val lastName = lastNameEditText.text.toString().trim()
            val username = usernameEditText.text.toString().trim()
            val email = emailEditText.text.toString().trim()
            val password = passwordEditText.text.toString().trim()
            val address = addressEditText.text.toString().trim()
            val phone = phoneEditText.text.toString().trim()

            if (validateInputs(firstName, lastName, username, email, password, address, phone)) {
                registerUser(firstName, lastName, username, email, password, address, phone)
            }
        }

        // Set OnClickListener for sign in text
        signInTextView.setOnClickListener {
            finish() // Go back to sign in
        }
    }

    private fun validateInputs(firstName: String, lastName: String, username: String, email: String, password: String, address: String, phone: String): Boolean {
        var isValid = true

        // First Name validation
        if (firstName.isEmpty()) {
            firstNameEditText.error = "First name is required"
            isValid = false
        } else if (firstName.length > 50) {
            firstNameEditText.error = "First name must be less than 50 characters"
            isValid = false
        }
        
        // Last Name validation
        if (lastName.isEmpty()) {
            lastNameEditText.error = "Last name is required"
            isValid = false
        } else if (lastName.length > 50) {
            lastNameEditText.error = "Last name must be less than 50 characters"
            isValid = false
        }

        // Username validation
        if (username.isEmpty()) {
            usernameEditText.error = "Username is required"
            isValid = false
        } else if (username.length < 3 || username.length > 20) {
            usernameEditText.error = "Username must be between 3 and 20 characters"
            isValid = false
        }

        // Email validation - match backend @Size(max = 50) @Email
        if (email.isEmpty()) {
            emailEditText.error = "Email is required"
            isValid = false
        } else if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            emailEditText.error = "Please enter a valid email"
            isValid = false
        } else if (email.length > 50) {
            emailEditText.error = "Email must be less than 50 characters"
            isValid = false
        }

        // Password validation - match backend @Size(min = 6, max = 40)
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

        // Address validation
        if (address.isEmpty()) {
            addressEditText.error = "Address is required"
            isValid = false
        }

        // Phone validation
        if (phone.isEmpty()) {
            phoneEditText.error = "Phone number is required"
            isValid = false
        }

        return isValid
    }

    private fun registerUser(firstName: String, lastName: String, username: String, email: String, password: String, address: String, phone: String) {
        showLoading(true)

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = ApiClient.authService.register(
                    SignUpRequest(
                        username = username,
                        email = email,
                        password = password,
                        firstName = firstName,
                        lastName = lastName,
                        address = address,
                        phone = phone,
                        roles = setOf("resident") // Explicitly set role as resident for mobile users
                    )
                )

                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        showLoading(false)
                        // Show success message
                        showToast("Registration successful. Please sign in.")
                        // Return to login screen
                        finish()
                    } else {
                        showLoading(false)
                        when (response.code()) {
                            400 -> showToast("Username or email already in use")
                            else -> showToast("Registration failed: ${response.message()}")
                        }
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    showLoading(false)
                    showToast("Network error: ${e.message}")
                }
            }
        }
    }

    private fun showLoading(isLoading: Boolean) {
        progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        signUpButton.isEnabled = !isLoading
    }
    
    private fun showToast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
}