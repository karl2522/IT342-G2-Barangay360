package com.example.barangay360_mobile

import android.app.DatePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import android.widget.Button
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.example.barangay360_mobile.api.ApiClient
import com.example.barangay360_mobile.api.models.UserProfile
import com.example.barangay360_mobile.api.models.UserUpdateRequest
import com.example.barangay360_mobile.util.SessionManager
import com.google.android.material.bottomappbar.BottomAppBar
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class ProfileEditFragment : Fragment() {

    private lateinit var firstNameInput: TextInputEditText
    private lateinit var lastNameInput: TextInputEditText
    private lateinit var phoneNumberInput: TextInputEditText
    private lateinit var addressInput: TextInputEditText
    private lateinit var usernameInput: TextInputEditText
    private lateinit var emailInput: TextInputEditText
    private lateinit var bioInput: TextInputEditText
    private lateinit var loadingIndicator: ProgressBar
    private lateinit var sessionManager: SessionManager
    
    private var userId: Long? = null
    private var userProfile: UserProfile? = null

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Hide bottom navigation as soon as this fragment is created
        hideBottomNavigation()
        return inflater.inflate(R.layout.fragment_profile_edit, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Initialize session manager using getInstance()
        sessionManager = SessionManager.getInstance()
        userId = sessionManager.getUserId()?.toLongOrNull()

        // Initialize input fields
        firstNameInput = view.findViewById(R.id.first_name_input)
        lastNameInput = view.findViewById(R.id.last_name_input)
        phoneNumberInput = view.findViewById(R.id.phone_number_input)
        addressInput = view.findViewById(R.id.address_input)
        usernameInput = view.findViewById(R.id.username_input)
        emailInput = view.findViewById(R.id.email_input)
        bioInput = view.findViewById(R.id.bio_input)
        
        // Initialize loading indicator
        loadingIndicator = view.findViewById(R.id.loading_indicator)

        // Setup back button
        view.findViewById<ImageView>(R.id.btn_back).setOnClickListener {
            // Show bottom navigation before going back
            showBottomNavigation()
            // Navigate back to profile screen
            requireActivity().onBackPressed()
        }

        // Setup profile image change
        view.findViewById<ImageView>(R.id.btn_change_photo)?.setOnClickListener {
            // Show image picker options (camera/gallery)
            showImagePickerDialog()
        }

        // Setup update button
        view.findViewById<Button>(R.id.btn_update_profile).setOnClickListener {
            updateProfile()
        }

        // Load current user data
        loadUserData()
    }

    override fun onResume() {
        super.onResume()
        // Make sure bottom navigation stays hidden if fragment resumes
        hideBottomNavigation()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        // Show bottom navigation again when leaving this fragment
        showBottomNavigation()
    }

    private fun hideBottomNavigation() {
        val bottomAppBar = activity?.findViewById<BottomAppBar>(R.id.bottomAppBar)
        val fab = activity?.findViewById<FloatingActionButton>(R.id.fab)
        val bottomNavigationView = activity?.findViewById<BottomNavigationView>(R.id.bottomNavigationView)

        bottomAppBar?.visibility = View.GONE
        fab?.visibility = View.GONE
        bottomNavigationView?.visibility = View.GONE
    }

    private fun showBottomNavigation() {
        val bottomAppBar = activity?.findViewById<BottomAppBar>(R.id.bottomAppBar)
        val fab = activity?.findViewById<FloatingActionButton>(R.id.fab)
        val bottomNavigationView = activity?.findViewById<BottomNavigationView>(R.id.bottomNavigationView)

        bottomAppBar?.visibility = View.VISIBLE
        fab?.visibility = View.VISIBLE
        bottomNavigationView?.visibility = View.VISIBLE
    }

    private fun loadUserData() {
        if (userId == null) {
            Toast.makeText(context, "User ID not found. Please login again.", Toast.LENGTH_SHORT).show()
            return
        }

        // Show loading indicator
        loadingIndicator.visibility = View.VISIBLE

        // Get the auth token
        val token = sessionManager.getAuthToken()

        if (token.isNullOrEmpty()) {
            Toast.makeText(context, "Authorization token is missing. Please login again.", Toast.LENGTH_SHORT).show()
            return
        }

        // Fetch user profile from API
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                // Remove the extra "Bearer $token" argument
                val response = ApiClient.userService.getUserProfile(userId!!)

                if (response.isSuccessful) {
                    userProfile = response.body()
                    userProfile?.let { profile ->
                        // Populate form fields with user data
                        firstNameInput.setText(profile.firstName)
                        lastNameInput.setText(profile.lastName)
                        phoneNumberInput.setText(profile.phone ?: "")
                        addressInput.setText(profile.address ?: "")
                        usernameInput.setText(profile.username)
                        emailInput.setText(profile.email)
                        bioInput.setText(profile.bio ?: "")

                        // Username and email should be read-only
                        usernameInput.isEnabled = false
                        emailInput.isEnabled = false
                    }
                } else {
                    Toast.makeText(
                        context,
                        "Failed to load profile: ${response.message()}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } catch (e: Exception) {
                Toast.makeText(
                    context,
                    "Error: ${e.message}",
                    Toast.LENGTH_SHORT
                ).show()
            } finally {
                loadingIndicator.visibility = View.GONE
            }
        }
    }

    private fun showImagePickerDialog() {
        // In a real app, you would implement an image picker here
        // For simplicity, we'll just show a toast
        Toast.makeText(requireContext(), "Image picker would open here", Toast.LENGTH_SHORT).show()
    }

    private fun updateProfile() {
        // Validate inputs
        if (validateInputs()) {
            // Show loading indicator
            loadingIndicator.visibility = View.VISIBLE

            // Collect form data
            val firstName = firstNameInput.text.toString().trim()
            val lastName = lastNameInput.text.toString().trim()
            val phoneNumber = phoneNumberInput.text.toString().trim()
            val address = addressInput.text.toString().trim()
            val bio = bioInput.text.toString().trim()

            // Create update request
            val updateRequest = UserUpdateRequest(
                firstName = firstName,
                lastName = lastName,
                phone = phoneNumber,
                address = address,
                bio = bio
            )

            // Call API to update profile
            viewLifecycleOwner.lifecycleScope.launch {
                try {
                    val response = ApiClient.userService.updateUserProfile(userId!!, updateRequest)

                    if (response.isSuccessful) {
                        // Update local session data
                        sessionManager.saveUserDetails(
                            userId.toString(),
                            firstName,
                            lastName,
                            userProfile?.email ?: "",
                            listOf("resident"), // Default role
                            phoneNumber,
                            address,
                            true, // Default value for isActive
                            0     // Default value for warnings
                        )

                        // Show success message
                        Toast.makeText(requireContext(), "Profile updated successfully", Toast.LENGTH_SHORT).show()

                        // Navigate back to profile
                        showBottomNavigation()
                        requireActivity().onBackPressed()
                    } else {
                        Toast.makeText(
                            requireContext(),
                            "Failed to update profile: ${response.message()}",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                } catch (e: Exception) {
                    Toast.makeText(
                        requireContext(),
                        "Error: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                } finally {
                    loadingIndicator.visibility = View.GONE
                }
            }
        }
    }

    private fun validateInputs(): Boolean {
        var isValid = true

        // Validate first name
        if (firstNameInput.text.toString().trim().isEmpty()) {
            view?.findViewById<TextInputLayout>(R.id.first_name_layout)?.error = "First name is required"
            isValid = false
        } else {
            view?.findViewById<TextInputLayout>(R.id.first_name_layout)?.error = null
        }

        // Validate last name
        if (lastNameInput.text.toString().trim().isEmpty()) {
            view?.findViewById<TextInputLayout>(R.id.last_name_layout)?.error = "Last name is required"
            isValid = false
        } else {
            view?.findViewById<TextInputLayout>(R.id.last_name_layout)?.error = null
        }

        return isValid
    }
}