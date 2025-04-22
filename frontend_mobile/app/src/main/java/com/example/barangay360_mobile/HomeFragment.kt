package com.example.barangay360_mobile

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.example.barangay360_mobile.util.SessionManager

class HomeFragment : Fragment() {

    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var welcomeTextView: TextView
    private lateinit var sessionManager: SessionManager

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inflate the layout for this fragment
        val view = inflater.inflate(R.layout.fragment_home, container, false)

        // Initialize SessionManager
        sessionManager = SessionManager(requireContext())

        // Initialize welcome message
        welcomeTextView = view.findViewById(R.id.txt_welcome)
        updateWelcomeMessage()

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

        return view
    }

    private fun updateWelcomeMessage() {
        // Get user's name from SessionManager
        val firstName = sessionManager.getFirstName() ?: ""
        val lastName = sessionManager.getLastName() ?: ""
        
        // If we have at least one name component, use it
        val displayName = when {
            firstName.isNotEmpty() && lastName.isNotEmpty() -> "$firstName $lastName"
            firstName.isNotEmpty() -> firstName
            lastName.isNotEmpty() -> lastName
            else -> "Resident" // Default fallback
        }
        
        // Update welcome message
        welcomeTextView.text = "Welcome, $displayName!"
    }

    private fun refreshHomeContent() {
        // TODO: Implement your data refresh logic here
        // For example:
        // 1. Fetch new announcements
        // 2. Update any real-time data
        // 3. Reload content from server

        // Update welcome message in case user data changed
        updateWelcomeMessage()

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