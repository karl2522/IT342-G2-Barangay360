// File: com/example/barangay360_mobile/ProfileFragment.kt
package com.example.barangay360_mobile

import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
// import androidx.core.content.ContextCompat // Keep if used for role badge styling
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
// import androidx.swiperefreshlayout.widget.SwipeRefreshLayout // Not directly used via binding if root is SwipeRefresh
import com.example.barangay360_mobile.api.ApiClient
import com.example.barangay360_mobile.api.models.ServiceRequestResponse
import com.example.barangay360_mobile.api.models.UserProfile
import com.example.barangay360_mobile.databinding.FragmentProfileBinding // Using ViewBinding
import com.example.barangay360_mobile.util.SessionManager
import com.google.android.material.bottomnavigation.BottomNavigationView
import kotlinx.coroutines.launch
import java.util.Locale // For toLowerCase

class ProfileFragment : Fragment() {

    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!! // Property delegate to access binding

    private lateinit var sessionManager: SessionManager

    // TextViews for service request counts - Initialized in onCreateView
    private lateinit var pendingCountTextView: TextView
    private lateinit var approvedCountTextView: TextView
    private lateinit var rejectedCountTextView: TextView
    private lateinit var btnViewDocuments: Button // Button for viewing document history

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentProfileBinding.inflate(inflater, container, false)
        sessionManager = SessionManager.getInstance()

        // Initialize views for service request counts from binding
        // CRITICAL: Ensure these IDs exist in your fragment_profile.xml
        try {
            pendingCountTextView = binding.pendingCount   // e.g., android:id="@+id/pending_count"
            approvedCountTextView = binding.approvedCount // e.g., android:id="@+id/approved_count"
            rejectedCountTextView = binding.rejectedCount // e.g., android:id="@+id/rejected_count"
            btnViewDocuments = binding.btnViewDocuments     // e.g., android:id="@+id/btn_view_documents"
        } catch (e: Exception) {
            Log.e("ProfileFragment", "CRITICAL: Service count TextViews or btnViewDocuments not found. Check fragment_profile.xml IDs.", e)
            Toast.makeText(context, "Layout error: Profile service count views missing.", Toast.LENGTH_LONG).show()
        }

        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Setup UI listeners and initial data load
        setupSwipeRefresh()
        setupButtonListeners() // Consolidated button setup

        fetchProfileDataAndServiceRequests() // Fetches both profile and service requests
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefreshLayout.setColorSchemeResources(
            R.color.maroon,
            android.R.color.holo_green_dark,
            android.R.color.holo_blue_dark
        )
        binding.swipeRefreshLayout.setOnRefreshListener {
            fetchProfileDataAndServiceRequests()
        }
    }

    private fun setupButtonListeners() {
        // Edit Profile Button
        binding.btnEditProfile.setOnClickListener {
            navigateToEditProfile()
        }

        // Back Button
        binding.profileBtnBack.setOnClickListener {
            activity?.onBackPressedDispatcher?.onBackPressed()
        }

        // "View Document History" Button
        // Ensure btnViewDocuments was initialized
        if (::btnViewDocuments.isInitialized) {
            btnViewDocuments.setOnClickListener {
                navigateToServicesFragment()
            }
        } else {
            Log.e("ProfileFragment", "btnViewDocuments was not initialized. Check its ID in fragment_profile.xml.")
        }


        // Other Account Buttons (Logout, Change Password, Help)
        // These are assumed to be part of your existing layout and binding
        binding.btnLogout.setOnClickListener {
            logout()
        }
//        binding.btnChangePassword?.setOnClickListener { // Optional chaining if not always present
//            Toast.makeText(context, "Change Password clicked", Toast.LENGTH_SHORT).show()
//        }
//        binding.btnHelp?.setOnClickListener { // Optional chaining
//            Toast.makeText(context, "Help & Support clicked", Toast.LENGTH_SHORT).show()
//        }

        // Admin-specific buttons if they exist in your layout and binding
        // Example:
        // binding.adminSection?.let { adminLayout ->
        //    adminLayout.findViewById<Button>(R.id.btn_manage_users)?.setOnClickListener {
        //        Toast.makeText(context, "Manage Users clicked", Toast.LENGTH_SHORT).show()
        //    }
        //    adminLayout.findViewById<Button>(R.id.btn_system_settings)?.setOnClickListener {
        //        Toast.makeText(context, "System Settings clicked", Toast.LENGTH_SHORT).show()
        //    }
        // }
    }

    private fun navigateToServicesFragment() {
        val servicesFragment = ServicesFragment() // Assuming ServicesFragment.newInstance() if available
        parentFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, servicesFragment)
            .addToBackStack(null) // Allows user to return to ProfileFragment
            .commit()

        // Highlight the "Services" tab in the BottomNavigationView
        (activity as? HomeActivity)?.findViewById<BottomNavigationView>(R.id.bottomNavigationView)?.selectedItemId = R.id.services
    }

    private fun fetchProfileDataAndServiceRequests() {
        if (!isAdded || _binding == null) return // Ensure fragment is attached and binding is available
        binding.swipeRefreshLayout.isRefreshing = true

        val userIdString = sessionManager.getUserId()
        val token = sessionManager.getAuthToken()

        if (userIdString == null || token == null) {
            if (isAdded) {
                Toast.makeText(context, "User not authenticated. Please login again.", Toast.LENGTH_SHORT).show()
                binding.swipeRefreshLayout.isRefreshing = false
            }
            return
        }

        val userIdLong = userIdString.toLongOrNull()
        if (userIdLong == null) {
            if (isAdded) {
                Toast.makeText(context, "Invalid user ID format.", Toast.LENGTH_SHORT).show()
                binding.swipeRefreshLayout.isRefreshing = false
            }
            return
        }

        // Launch a coroutine to fetch data
        viewLifecycleOwner.lifecycleScope.launch {
            var profileFetchError = false
            var serviceFetchError = false
            try {
                // Fetch User Profile
                val profileResponse = ApiClient.userService.getUserProfile(userIdLong)
                if (!isAdded) return@launch // Check again before UI update

                if (profileResponse.isSuccessful) {
                    profileResponse.body()?.let { updateUIWithProfile(it) }
                } else {
                    profileFetchError = true
                    Log.e("ProfileFragment", "Failed to load profile: ${profileResponse.code()} - ${profileResponse.message()}")
                }

                // Fetch Service Requests for counts
                val serviceRequestsResponse = ApiClient.serviceRequestService.getServiceRequestsByUserId(userIdLong)
                if (!isAdded) return@launch // Check again

                if (serviceRequestsResponse.isSuccessful) {
                    val serviceRequests = serviceRequestsResponse.body() ?: emptyList()
                    updateUIWithServiceRequestCounts(serviceRequests)
                } else {
                    serviceFetchError = true
                    Log.e("ProfileFragment", "Failed to load service requests: ${serviceRequestsResponse.code()} - ${serviceRequestsResponse.message()}")
                    if (isAdded) updateUIWithServiceRequestCounts(emptyList()) // Show 0 counts on error
                }

                if(isAdded){
                    if(profileFetchError) Toast.makeText(context, "Failed to load profile data.", Toast.LENGTH_SHORT).show()
                    if(serviceFetchError) Toast.makeText(context, "Failed to load service request data.", Toast.LENGTH_SHORT).show()
                }

            } catch (e: Exception) {
                if (isAdded) {
                    Log.e("ProfileFragment", "Exception fetching data: ${e.message}", e)
                    Toast.makeText(context, "Error loading profile data.", Toast.LENGTH_SHORT).show()
                    // Set counts to "0" or "-" on general exception
                    if (::pendingCountTextView.isInitialized) pendingCountTextView.text = "0"
                    if (::approvedCountTextView.isInitialized) approvedCountTextView.text = "0"
                    if (::rejectedCountTextView.isInitialized) rejectedCountTextView.text = "0"
                }
            } finally {
                if (isAdded && _binding != null) {
                    binding.swipeRefreshLayout.isRefreshing = false
                }
            }
        }
    }

    private fun updateUIWithProfile(profile: UserProfile) {
        if (!isAdded || _binding == null) return

        binding.profileName.text = "${profile.firstName} ${profile.lastName}"
        binding.profileId.text = "Resident ID: BRG-${profile.id}"
        binding.profilePhone.text = profile.phone ?: "Not set"
        binding.profileEmail.text = profile.email
        binding.profileAddress.text = profile.address ?: "Not set"

        // Your existing role display logic
        val isOfficial = profile.roles.any { it.name.equals("ROLE_OFFICIAL", ignoreCase = true) }
        val isAdmin = profile.roles.any { it.name.equals("ROLE_ADMIN", ignoreCase = true) }

        val roleText = when {
            isAdmin -> "Admin"
            isOfficial -> "Official"
            else -> "Resident"
        }
        binding.profileRole.text = roleText
//        setupRoleSpecificUI(roleText)
    }

    // THIS IS THE NEW FUNCTION TO UPDATE SERVICE REQUEST COUNTS
    private fun updateUIWithServiceRequestCounts(requests: List<ServiceRequestResponse>) {
        if (!isAdded || !::pendingCountTextView.isInitialized || !::approvedCountTextView.isInitialized || !::rejectedCountTextView.isInitialized) {
            Log.w("ProfileFragment", "updateUIWithServiceRequestCounts called but views not ready or fragment detached.")
            return
        }

        var pending = 0
        var approved = 0
        var rejected = 0

        requests.forEach { request ->
            when (request.status?.lowercase(Locale.ROOT)) { // Use lowercase for robust comparison
                "pending" -> pending++
                "approved", "completed" -> approved++ // Consider "completed" as "approved" for summary
                "rejected" -> rejected++
                // You can add "cancelled" or other statuses if needed
            }
        }
        pendingCountTextView.text = pending.toString()
        approvedCountTextView.text = approved.toString()
        rejectedCountTextView.text = rejected.toString()
    }

//    private fun setupRoleSpecificUI(userRole: String) {
//        if (!isAdded || _binding == null || !::binding.profileRole.isInitialized ) return
//
//        // Your existing logic for showing/hiding admin section based on role
//        // Make sure 'adminSection' is an ID in your fragment_profile.xml and accessible via binding
//        binding.adminSection?.visibility = if (userRole == "Admin" || userRole == "Official") View.VISIBLE else View.GONE
//    }

    private fun navigateToEditProfile() {
        // Your existing navigation logic to ProfileEditFragment
        try {
            findNavController().navigate(R.id.action_profileFragment_to_profileEditFragment)
        } catch (e: Exception) {
            Log.e("ProfileFragment", "Navigation to ProfileEditFragment via NavController failed. Using manual transaction.", e)
            parentFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, ProfileEditFragment()) // Ensure ProfileEditFragment.newInstance() if it exists
                .addToBackStack("profile_edit") // Use a unique name for backstack
                .commit()
        }
    }

    private fun logout() {
        // Your existing logout logic
        if (!isAdded) return
        Toast.makeText(context, "Logging out...", Toast.LENGTH_SHORT).show()
        sessionManager.clearSession()
        val intent = Intent(requireContext(), SignInActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        activity?.finishAffinity()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null // Crucial for ViewBinding to prevent memory leaks
    }
}