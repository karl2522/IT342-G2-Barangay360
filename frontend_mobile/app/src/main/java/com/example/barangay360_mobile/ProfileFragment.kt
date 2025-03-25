package com.example.barangay360_mobile

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.Toast
import androidx.navigation.fragment.findNavController
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class ProfileFragment : Fragment() {
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout

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
        val editProfileButton: Button = view.findViewById(R.id.profile_btn_edit_profile)
        editProfileButton.setOnClickListener {
            navigateToEditProfile()
        }

        // Setup back button
        view.findViewById<ImageView>(R.id.profile_btn_back).setOnClickListener {
            // Show bottom navigation before going back

            // Navigate back to profile screen
            requireActivity().onBackPressed()
        }

        return view
    }

    private fun navigateToEditProfile() {
        // Create a ProfileEditFragment
        val profileEditFragment = ProfileEditFragment()

        // Option 1: Using Navigation Component
        try {
            findNavController().navigate(R.id.action_profileFragment_to_profileEditFragment)
        } catch (e: Exception) {
            // Option 2: Manual fragment transaction if Navigation Component isn't set up
            parentFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, profileEditFragment)
                .addToBackStack("profile")
                .commit()
        }
    }

    private fun refreshHomeContent() {
        // TODO: Implement your data refresh logic here
        // For example:
        // 1. Fetch new announcements
        // 2. Update any real-time data
        // 3. Reload content from server

        // Simulate network delay
        swipeRefreshLayout.postDelayed({
            // Your network operations would go here
            // ...

            // When done, hide the refresh indicator
            swipeRefreshLayout.isRefreshing = false

            // Optional: Show a confirmation toast
            Toast.makeText(context, "Content refreshed", Toast.LENGTH_SHORT).show()
        }, 1500) // Simulate a 1.5 second refresh operation
    }
}