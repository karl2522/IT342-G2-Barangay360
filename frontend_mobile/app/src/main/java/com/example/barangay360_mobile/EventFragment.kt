// File: New folder/android/java/com/example/barangay360_mobile/EventFragment.kt
package com.example.barangay360_mobile

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.barangay360_mobile.adapter.EventAdapter // Your existing adapter
import com.example.barangay360_mobile.api.ApiClient
import com.example.barangay360_mobile.api.models.EventResponse
import com.example.barangay360_mobile.databinding.FragmentEventBinding // Assuming ViewBinding
import com.example.barangay360_mobile.util.SessionManager
import kotlinx.coroutines.launch
import java.time.LocalDateTime // Import LocalDateTime

class EventFragment : Fragment() {

    private var _binding: FragmentEventBinding? = null
    private val binding get() = _binding!!

    private lateinit var eventAdapter: EventAdapter
    private lateinit var sessionManager: SessionManager

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentEventBinding.inflate(inflater, container, false)
        sessionManager = SessionManager.getInstance()
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        setupSwipeRefresh()
        checkUserRoleAndSetupFab()

        loadAndFilterEvents() // Renamed from loadEvents
    }

    private fun setupRecyclerView() {
        binding.recyclerEvents.layoutManager = LinearLayoutManager(context)
        eventAdapter = EventAdapter { event ->
            // Handle event item click - e.g., show more details
            Toast.makeText(context, "Clicked on event: ${event.title}", Toast.LENGTH_SHORT).show()
            // Example: showEventDetailsDialog(event)
        }
        binding.recyclerEvents.adapter = eventAdapter
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefreshLayoutEvents.setColorSchemeResources(R.color.maroon, R.color.teal_700)
        binding.swipeRefreshLayoutEvents.setOnRefreshListener {
            loadAndFilterEvents() // Call the filtering method on refresh
        }
    }

    private fun checkUserRoleAndSetupFab() {
        val userRoles = sessionManager.getUserRoles()
        if (userRoles.contains("ROLE_OFFICIAL") || userRoles.contains("ROLE_ADMIN")) {
            binding.fabAddEvent.visibility = View.VISIBLE
            binding.fabAddEvent.setOnClickListener {
                Toast.makeText(context, "Navigate to Create Event Screen (Not Implemented)", Toast.LENGTH_SHORT).show()
                // Example:
                // parentFragmentManager.beginTransaction()
                //    .replace(R.id.fragment_container, CreateEventFragment()) // You would need to create this
                //    .addToBackStack(null)
                //    .commit()
            }
        } else {
            binding.fabAddEvent.visibility = View.GONE
        }
    }

    private fun loadAndFilterEvents() {
        setLoadingState(true)
        if (!sessionManager.isLoggedIn()) {
            if (isAdded) Toast.makeText(context, "Please log in to view events.", Toast.LENGTH_SHORT).show()
            setLoadingState(false)
            updateEmptyStateVisibility(true) // Show "No upcoming events" if not logged in
            return
        }

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                // Fetch ALL events
                val response = ApiClient.eventService.getAllEvents()
                if (!isAdded) return@launch

                if (response.isSuccessful) {
                    val allEvents = response.body() ?: emptyList()
                    val now = LocalDateTime.now()

                    // Filter for upcoming events
                    val upcomingEvents = allEvents
                        .filter { it.start != null && it.start.isAfter(now) }
                        .sortedBy { it.start } // Sort by start date, soonest first

                    eventAdapter.submitList(upcomingEvents)
                    updateEmptyStateVisibility(upcomingEvents.isEmpty())
                } else {
                    Log.e("EventFragment", "API Error fetching events: ${response.code()} - ${response.message()}")
                    if (isAdded) Toast.makeText(requireContext(), "Failed to load events: ${response.code()}", Toast.LENGTH_SHORT).show()
                    eventAdapter.submitList(emptyList()) // Clear existing list on error
                    updateEmptyStateVisibility(true)
                }
            } catch (e: Exception) {
                if (isAdded) {
                    Log.e("EventFragment", "Exception fetching events: ${e.message}", e)
                    if (e !is kotlinx.coroutines.CancellationException) {
                        Toast.makeText(requireContext(), "Error loading events: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
                    }
                    eventAdapter.submitList(emptyList()) // Clear existing list on error
                    updateEmptyStateVisibility(true)
                }
            } finally {
                if (isAdded) setLoadingState(false)
            }
        }
    }

    private fun setLoadingState(isLoading: Boolean) {
        if (!isAdded || _binding == null) return
        binding.progressBarEvents.visibility = if (isLoading && !binding.swipeRefreshLayoutEvents.isRefreshing) View.VISIBLE else View.GONE
        if (!isLoading) {
            binding.swipeRefreshLayoutEvents.isRefreshing = false
        }
    }

    private fun updateEmptyStateVisibility(isEmpty: Boolean) {
        if (!isAdded || _binding == null) return
        binding.recyclerEvents.visibility = if (isEmpty) View.GONE else View.VISIBLE
        // Ensure the empty state text is "No upcoming events. Stay tuned!" from your XML
        binding.emptyStateEvents.visibility = if (isEmpty) View.VISIBLE else View.GONE
    }

    override fun onDestroyView() {
        super.onDestroyView()
        if (::eventAdapter.isInitialized && _binding != null) {
            binding.recyclerEvents.adapter = null // Clear adapter
        }
        _binding = null // Important for view binding
    }

    companion object {
        fun newInstance() = EventFragment()
    }
}