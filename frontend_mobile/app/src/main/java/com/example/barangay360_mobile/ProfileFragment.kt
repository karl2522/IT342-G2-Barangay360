package com.example.barangay360_mobile

import android.annotation.SuppressLint
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.example.barangay360_mobile.api.ApiClient
import com.example.barangay360_mobile.api.models.UserProfile
import com.example.barangay360_mobile.util.SessionManager
import kotlinx.coroutines.launch

class ProfileFragment : Fragment() {
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var profileRole: TextView
    private lateinit var adminSection: LinearLayout
    private lateinit var profileName: TextView
    private lateinit var profileId: TextView
    private lateinit var profilePhone: TextView
    private lateinit var profileEmail: TextView
    private lateinit var profileAddress: TextView
    private lateinit var sessionManager: SessionManager
    
    private var userProfile: UserProfile? = null

    @SuppressLint("MissingInflatedId")
    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inflate the layout for this fragment
        val view = inflater.inflate(R.layout.fragment_profile, container, false)

        // Initialize SessionManager
        sessionManager = SessionManager.getInstance()

        // Initialize SwipeRefreshLayout
        swipeRefreshLayout = view.findViewById(R.id.swipeRefreshLayout)

        // Configure refresh colors
        swipeRefreshLayout.setColorSchemeResources(
            R.color.maroon,
            android.R.color.holo_green_dark,
            android.R.color.holo_blue_dark
        )

        // Set up refresh listener
        swipeRefreshLayout.setOnRefreshListener {
            fetchUserProfile()
        }

        // Set up Edit Profile button click listener
        val editProfileButton: Button = view.findViewById(R.id.btn_edit_profile)
        editProfileButton.setOnClickListener {
            navigateToEditProfile()
        }

        // Setup back button
        view.findViewById<ImageView>(R.id.profile_btn_back)?.setOnClickListener {
            // Navigate back
            requireActivity().onBackPressed()
        }

        // Initialize profile views
        profileRole = view.findViewById(R.id.profile_role)
        adminSection = view.findViewById(R.id.admin_section)
        profileName = view.findViewById(R.id.profile_name)
        profileId = view.findViewById(R.id.profile_id)
        profilePhone = view.findViewById(R.id.profile_phone)
        profileEmail = view.findViewById(R.id.profile_email)
        profileAddress = view.findViewById(R.id.profile_address)

        return view
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Fetch user profile
        fetchUserProfile()

        // Set up account settings buttons
        setupAccountButtons(view)
    }

    private fun setupAccountButtons(view: View) {
        // Setup regular user buttons
        view.findViewById<Button>(R.id.btn_change_password)?.setOnClickListener {
            Toast.makeText(context, "Change Password clicked", Toast.LENGTH_SHORT).show()
        }

        view.findViewById<Button>(R.id.btn_help)?.setOnClickListener {
            Toast.makeText(context, "Help & Support clicked", Toast.LENGTH_SHORT).show()
        }

        view.findViewById<Button>(R.id.btn_logout)?.setOnClickListener {
            logout()
        }

        // Setup admin-specific buttons
        view.findViewById<Button>(R.id.btn_manage_users)?.setOnClickListener {
            Toast.makeText(context, "Manage Users clicked", Toast.LENGTH_SHORT).show()
        }

        view.findViewById<Button>(R.id.btn_system_settings)?.setOnClickListener {
            Toast.makeText(context, "System Settings clicked", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun logout() {
        Toast.makeText(context, "Logging out...", Toast.LENGTH_SHORT).show()
        
        // Clear session data
        sessionManager.clearSession()
        
        // Navigate to sign in screen
        val intent = android.content.Intent(requireContext(), SignInActivity::class.java)
        intent.flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        requireActivity().finish()
    }

    private fun navigateToEditProfile() {
        try {
            findNavController().navigate(R.id.action_profileFragment_to_profileEditFragment)
        } catch (e: Exception) {
            // Fall back to manual fragment transaction if navigation component isn't set up
            parentFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, ProfileEditFragment())
                .addToBackStack("profile")
                .commit()
        }
    }

    private fun fetchUserProfile() {
        // Show refresh indicator
        swipeRefreshLayout.isRefreshing = true

        // Get user ID and token from session
        val userId = sessionManager.getUserId()
        val token = sessionManager.getAuthToken()

        if (userId == null || token == null) {
            swipeRefreshLayout.isRefreshing = false
            Toast.makeText(context, "User not authenticated. Please login again.", Toast.LENGTH_SHORT).show()
            return
        }

        // Convert userId from String to Long
        val userIdLong = userId.toLongOrNull()
        if (userIdLong == null) {
            swipeRefreshLayout.isRefreshing = false
            Toast.makeText(context, "Invalid user ID format", Toast.LENGTH_SHORT).show()
            return
        }

        // Fetch user profile from API
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val response = ApiClient.userService.getUserProfile(userIdLong)

                if (response.isSuccessful) {
                    userProfile = response.body()
                    userProfile?.let { profile ->
                        updateUI(profile)
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
                swipeRefreshLayout.isRefreshing = false
            }
        }
    }


    private fun updateUI(profile: UserProfile) {
        // Update profile information
        profileName.text = "${profile.firstName} ${profile.lastName}"
        profileId.text = "Resident ID: BRG-${profile.id}"
        profilePhone.text = profile.phone ?: "No phone number"
        profileEmail.text = profile.email
        profileAddress.text = profile.address ?: "No address"
        
        // Determine user role and set up role-based UI
        val isOfficial = profile.roles.any { it.name.contains("ROLE_OFFICIAL") }
        val isAdmin = profile.roles.any { it.name.contains("ROLE_ADMIN") }
        
        when {
            isAdmin -> {
                profileRole.text = "Admin"
                setupRoleBasedUI("Admin")
            }
            isOfficial -> {
                profileRole.text = "Official"
                setupRoleBasedUI("Official") 
            }
            else -> {
                profileRole.text = "Resident"
                setupRoleBasedUI("Resident")
            }
        }
    }

    // Show or hide admin sections based on user role
    private fun setupRoleBasedUI(userRole: String) {
        // Only proceed if the views are properly initialized
        if (::profileRole.isInitialized && ::adminSection.isInitialized) {
            // Set the role text
            profileRole.text = userRole

            // Show admin section if the user is an admin or official
            if (userRole == "Admin" || userRole == "Official") {
                adminSection.visibility = View.VISIBLE

                // Change role badge background to a different color for admin/official
                val adminBadgeBg = GradientDrawable()
                val colorRes = if (userRole == "Admin") R.color.purple_500 else R.color.maroon
                adminBadgeBg.setColor(ContextCompat.getColor(requireContext(), colorRes))
                // Replace the problematic line with a direct value
                adminBadgeBg.cornerRadius = 8f * resources.displayMetrics.density // 8dp converted to pixels
                profileRole.background = adminBadgeBg
            } else {
                adminSection.visibility = View.GONE
            }
        }
    }
}