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
import androidx.navigation.fragment.findNavController
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class ProfileFragment : Fragment() {
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var profileRole: TextView
    private lateinit var adminSection: LinearLayout

    @SuppressLint("MissingInflatedId")
    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inflate the layout for this fragment
        val view = inflater.inflate(R.layout.fragment_profile, container, false)

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
            refreshHomeContent()
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


        // Initialize role-related views
        profileRole = view.findViewById(R.id.profile_role)
        adminSection = view.findViewById(R.id.admin_section)

        return view
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Setup role-based UI after views are created
        setupRoleBasedUI()

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
            Toast.makeText(context, "Logout clicked", Toast.LENGTH_SHORT).show()
            // TODO: Implement actual logout functionality
        }

        // Setup admin-specific buttons
        view.findViewById<Button>(R.id.btn_manage_users)?.setOnClickListener {
            Toast.makeText(context, "Manage Users clicked", Toast.LENGTH_SHORT).show()
        }

        view.findViewById<Button>(R.id.btn_system_settings)?.setOnClickListener {
            Toast.makeText(context, "System Settings clicked", Toast.LENGTH_SHORT).show()
        }
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

    private fun refreshHomeContent() {
        // Simulate network delay
        swipeRefreshLayout.postDelayed({
            // When done, hide the refresh indicator
            swipeRefreshLayout.isRefreshing = false

            // Optional: Show a confirmation toast
            Toast.makeText(context, "Profile refreshed", Toast.LENGTH_SHORT).show()
        }, 1500) // Simulate a 1.5 second refresh operation
    }

    // Show or hide admin sections based on user role
    private fun setupRoleBasedUI() {
        // Get the role from your user data
        val userRole = "Admin" // or "Resident" - replace with your actual data source

        // Only proceed if the views are properly initialized
        if (::profileRole.isInitialized && ::adminSection.isInitialized) {
            // Set the role text
            profileRole.text = userRole

            // Show admin section if the user is an admin
            if (userRole == "Admin") {
                adminSection.visibility = View.VISIBLE

                // Change role badge background to a different color for admin
                val adminBadgeBg = GradientDrawable()
                adminBadgeBg.setColor(ContextCompat.getColor(requireContext(), R.color.purple_500))
                // Replace the problematic line with a direct value
                adminBadgeBg.cornerRadius = 8f * resources.displayMetrics.density // 8dp converted to pixels
                profileRole.background = adminBadgeBg
            } else {
                adminSection.visibility = View.GONE
            }
        }
    }
}