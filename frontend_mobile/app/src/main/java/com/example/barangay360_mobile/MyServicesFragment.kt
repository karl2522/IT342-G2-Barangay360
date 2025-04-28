package com.example.barangay360_mobile

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog // Import AlertDialog
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.example.barangay360_mobile.api.ApiClient
import com.example.barangay360_mobile.api.models.ServiceRequestResponse
import com.example.barangay360_mobile.util.SessionManager
import com.google.android.material.chip.ChipGroup
import kotlinx.coroutines.launch
import java.time.OffsetDateTime // Ensure OffsetDateTime is imported
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale // Import Locale for status comparison

class MyServicesFragment : Fragment() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var emptyStateView: LinearLayout
    private lateinit var emptyStateText: TextView // Reference for empty text
    private lateinit var progressBar: ProgressBar
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var sessionManager: SessionManager
    private lateinit var servicesAdapter: MyServicesAdapter // New Adapter
    private lateinit var filterChipGroup: ChipGroup

    // Store the full list of services fetched from API
    private var allServices: List<ServiceRequestResponse> = emptyList()
    private var currentFilter: String = "ALL" // Possible values: "ALL", "PENDING", "APPROVED", "REJECTED"


    // Define service status constants (use lowercase)
    companion object {
        const val FILTER_ALL = "ALL"
        const val FILTER_PENDING = "pending"
        const val FILTER_APPROVED = "approved"
        const val FILTER_REJECTED = "rejected"
    }


    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_my_services, container, false)

        sessionManager = SessionManager(requireContext())
        recyclerView = view.findViewById(R.id.recycler_services)
        emptyStateView = view.findViewById(R.id.empty_state_view)
        emptyStateText = view.findViewById(R.id.empty_state_text) // Initialize empty text
        progressBar = view.findViewById(R.id.my_services_progress_bar)
        swipeRefreshLayout = view.findViewById(R.id.my_services_swipe_refresh)
        filterChipGroup = view.findViewById(R.id.service_filter_chip_group)

        setupRecyclerView()
        setupFilterChips() // Setup chip listener
        setupSwipeRefresh()

        view.findViewById<Button>(R.id.btn_create_request)?.setOnClickListener {
            navigateToRequestServices()
        }

        return view
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        fetchUserServices() // Fetch initial data
    }

    private fun setupRecyclerView() {
        recyclerView.layoutManager = LinearLayoutManager(context)
        servicesAdapter = MyServicesAdapter { service -> // Pass click listener lambda
            showServiceDetailsDialog(service)
        }
        recyclerView.adapter = servicesAdapter
    }

    private fun setupFilterChips() {
        filterChipGroup.setOnCheckedStateChangeListener { group, checkedIds ->
            if (checkedIds.isEmpty()) {
                // Should not happen with singleSelection=true, but handle defensively
                currentFilter = FILTER_ALL
                group.check(R.id.chip_filter_all) // Re-check "All" if somehow nothing is checked
            } else {
                currentFilter = when (checkedIds[0]) {
                    R.id.chip_filter_pending -> FILTER_PENDING
                    R.id.chip_filter_approved -> FILTER_APPROVED
                    R.id.chip_filter_rejected -> FILTER_REJECTED
                    else -> FILTER_ALL // Default to ALL
                }
            }
            filterAndDisplayServices() // Apply filter when selection changes
        }
    }

    private fun setupSwipeRefresh() {
        swipeRefreshLayout.setColorSchemeResources(R.color.maroon, R.color.teal_700)
        swipeRefreshLayout.setOnRefreshListener {
            fetchUserServices()
        }
    }


    private fun fetchUserServices() {
        setLoadingState(true)

        val userId = sessionManager.getUserId()
        val token = sessionManager.getAuthToken()

        if (userId == null || token == null) {
            if (isAdded) Toast.makeText(requireContext(), "Session error. Please log in.", Toast.LENGTH_SHORT).show()
            setLoadingState(false)
            updateEmptyStateVisibility(true) // Show empty state if not logged in
            return
        }

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val response = ApiClient.serviceRequestService.getServiceRequestsByUserId("Bearer $token", userId)

                if (!isAdded) return@launch

                if (response.isSuccessful) {
                    allServices = response.body() ?: emptyList()
                    // Sort by date descending (most recent first)
                    allServices = allServices.sortedByDescending { it.createdAt ?: OffsetDateTime.MIN }
                    filterAndDisplayServices() // Display initial filtered list
                } else {
                    Log.e("MyServices", "API Error: ${response.code()} - ${response.message()}")
                    if(isAdded) Toast.makeText(requireContext(), "Failed to load services: ${response.code()}", Toast.LENGTH_SHORT).show()
                    allServices = emptyList() // Clear list on error
                    filterAndDisplayServices() // Show empty state
                }
            } catch (e: Exception) {
                if (isAdded) {
                    Log.e("MyServices", "Exception: ${e.message}", e)
                    if (e !is kotlinx.coroutines.CancellationException) {
                        Toast.makeText(requireContext(), "Error: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
                    }
                    allServices = emptyList() // Clear list on exception
                    filterAndDisplayServices() // Show empty state
                }
            } finally {
                setLoadingState(false)
            }
        }
    }

    // Filter the full list based on currentFilter and update adapter
    private fun filterAndDisplayServices() {
        val filteredList = if (currentFilter == FILTER_ALL) {
            allServices
        } else {
            allServices.filter { it.status?.lowercase(Locale.ROOT) == currentFilter }
        }
        servicesAdapter.submitList(filteredList) // Submit to ListAdapter
        updateEmptyStateVisibility(filteredList.isEmpty())
    }

    // Show/Hide loading indicators
    private fun setLoadingState(isLoading: Boolean) {
        if (!isAdded) return // Don't update UI if fragment not added

        if (::progressBar.isInitialized) {
            progressBar.visibility = if (isLoading && !swipeRefreshLayout.isRefreshing) View.VISIBLE else View.GONE
        }
        if (!isLoading && ::swipeRefreshLayout.isInitialized) {
            swipeRefreshLayout.isRefreshing = false
        }
    }

    // Show/hide empty state view and RecyclerView
    private fun updateEmptyStateVisibility(isEmpty: Boolean) {
        if (!isAdded) return // Don't update UI if fragment not added

        if (::recyclerView.isInitialized && ::emptyStateView.isInitialized && ::emptyStateText.isInitialized) {
            if (isEmpty) {
                recyclerView.visibility = View.GONE
                emptyStateView.visibility = View.VISIBLE
                // Set appropriate text based on filter
                emptyStateText.text = if (currentFilter == FILTER_ALL) {
                    "You currently have no services requested"
                } else {
                    "No services found with status: ${currentFilter.replaceFirstChar { it.uppercase() }}"
                }
            } else {
                recyclerView.visibility = View.VISIBLE
                emptyStateView.visibility = View.GONE
            }
        }
    }

    // Function to show details (simple dialog for now)
    private fun showServiceDetailsDialog(service: ServiceRequestResponse) {
        if (!isAdded) return // Ensure fragment is attached

        val detailsMessage = """
            Service Type: ${service.serviceType ?: "N/A"}
            Status: ${service.status ?: "N/A"}
            Purpose: ${service.purpose ?: "N/A"}
            Details: ${service.details ?: "N/A"}
            Contact: ${service.contactNumber ?: "N/A"}
            Address: ${service.address ?: "N/A"}
            Requested On: ${service.createdAt?.format(DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM)) ?: "N/A"}
            Last Updated: ${service.updatedAt?.format(DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM)) ?: "N/A"}
        """.trimIndent()

        AlertDialog.Builder(requireContext())
            .setTitle("Service Request Details (ID: ${service.id ?: "N/A"})")
            .setMessage(detailsMessage)
            .setPositiveButton("Close", null)
            .show()
    }


    private fun navigateToRequestServices() {
        (parentFragment as? ServicesFragment)?.viewPager?.currentItem = 0 ?: run {
            requireActivity().supportFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, RequestServicesFragment())
                .addToBackStack(null)
                .commit()
        }
    }

    // --- New RecyclerView Adapter ---
    inner class MyServicesAdapter(
        private val onItemClicked: (ServiceRequestResponse) -> Unit // Click listener lambda
    ) : ListAdapter<ServiceRequestResponse, MyServicesAdapter.ViewHolder>(ServiceDiffCallback()) {

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_service, parent, false) // Use your item layout
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val service = getItem(position)
            holder.bind(service)
        }

        inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            private val titleView: TextView = itemView.findViewById(R.id.service_title)
            private val dateView: TextView = itemView.findViewById(R.id.service_date)
            private val descriptionView: TextView = itemView.findViewById(R.id.service_description)
            private val statusView: TextView = itemView.findViewById(R.id.service_status)
            private val cardRoot: View = itemView.findViewById(R.id.service_card_root) // Get root for click listener

            fun bind(service: ServiceRequestResponse) {
                titleView.text = service.serviceType ?: "Unknown Service"
                dateView.text = service.createdAt?.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM)) ?: "No Date"
                descriptionView.text = "Purpose: ${service.purpose ?: "N/A"}" // Show purpose in description

                val status = service.status?.lowercase(Locale.ROOT) ?: FILTER_PENDING // Default to pending if null
                statusView.text = status.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.ROOT) else it.toString() } // Capitalize

                // Set status background and text color
                when (status) {
                    FILTER_APPROVED -> {
                        statusView.setBackgroundResource(R.drawable.bg_status_approved)
                        statusView.setTextColor(ContextCompat.getColor(itemView.context, R.color.approved_text))
                    }
                    FILTER_REJECTED -> {
                        statusView.setBackgroundResource(R.drawable.bg_status_rejected)
                        statusView.setTextColor(ContextCompat.getColor(itemView.context, R.color.rejected_text))
                    }
                    else -> { // Default to Pending style
                        statusView.setBackgroundResource(R.drawable.bg_status_pending)
                        statusView.setTextColor(ContextCompat.getColor(itemView.context, R.color.pending_text))
                    }
                }

                // Set click listener for the entire card
                cardRoot.setOnClickListener {
                    onItemClicked(service)
                }
            }
        }
    }

    // DiffUtil Callback for ListAdapter performance
    class ServiceDiffCallback : DiffUtil.ItemCallback<ServiceRequestResponse>() {
        override fun areItemsTheSame(oldItem: ServiceRequestResponse, newItem: ServiceRequestResponse): Boolean {
            return oldItem.id == newItem.id // Compare by unique ID
        }

        override fun areContentsTheSame(oldItem: ServiceRequestResponse, newItem: ServiceRequestResponse): Boolean {
            return oldItem == newItem // Compare all fields for changes
        }
    }

}