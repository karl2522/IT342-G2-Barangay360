package com.example.barangay360_mobile

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
//import com.bumptech.glide.Glide // Add Glide dependency if you want to load images
import com.example.barangay360_mobile.api.ApiClient
import com.example.barangay360_mobile.api.models.AnnouncementResponse
import com.example.barangay360_mobile.util.SessionManager
import com.google.android.material.floatingactionbutton.FloatingActionButton
import kotlinx.coroutines.launch
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

class AnnouncementFragment : Fragment() {

    // UI Components
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var recyclerView: RecyclerView
    private lateinit var emptyStateView: LinearLayout
    private lateinit var progressBar: ProgressBar
    private lateinit var fabAddAnnouncement: FloatingActionButton
    private lateinit var announcementsAdapter: AnnouncementAdapter // Use ListAdapter
    private lateinit var sessionManager: SessionManager // Add SessionManager


    // Removed filtering variables

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_announcement, container, false)

        sessionManager = SessionManager.getInstance() // Get the singleton instance

        // Initialize UI components
        swipeRefreshLayout = view.findViewById(R.id.swipeRefreshLayout)
        recyclerView = view.findViewById(R.id.recycler_announcements)
        emptyStateView = view.findViewById(R.id.empty_state)
        progressBar = view.findViewById(R.id.progress_bar)
        fabAddAnnouncement = view.findViewById(R.id.fab_add_announcement)

        setupRecyclerView()
        setupSwipeRefresh()

        // Check if user is an admin/official to show FAB (adjust logic as needed)
        checkUserRole()

        // Setup FAB click (implement actual navigation/dialog later)
        fabAddAnnouncement.setOnClickListener {
            // Example: Navigate to a CreateAnnouncementFragment
            // findNavController().navigate(R.id.action_announcementFragment_to_createAnnouncementFragment)
            if (isAdded) Toast.makeText(context, "Create announcement feature coming soon", Toast.LENGTH_SHORT).show()
        }

        return view
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        loadAnnouncements() // Load data when view is ready
    }

    private fun setupRecyclerView() {
        recyclerView.layoutManager = LinearLayoutManager(context)
        announcementsAdapter = AnnouncementAdapter { announcement ->
            // Handle item click (e.g., view details)
            viewAnnouncementDetails(announcement)
        }
        recyclerView.adapter = announcementsAdapter
    }


    private fun setupSwipeRefresh() {
        swipeRefreshLayout.setColorSchemeResources(R.color.maroon)
        swipeRefreshLayout.setOnRefreshListener {
            loadAnnouncements() // Reload data on refresh
        }
    }

    private fun checkUserRole() {
        // Since mobile app users are always residents, hide the FAB
        fabAddAnnouncement.visibility = View.GONE
    }

    private fun loadAnnouncements() {
        setLoadingState(true) // Show loading

        val token = sessionManager.getAuthToken()
        if (token == null) {
            if(isAdded) Toast.makeText(requireContext(), "Please log in to view announcements.", Toast.LENGTH_SHORT).show()
            setLoadingState(false)
            updateEmptyStateVisibility(true) // Show empty state if not logged in
            return
        }

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val response = ApiClient.announcementService.getAnnouncements()

                if (!isAdded) return@launch // Exit if fragment detached

                if (response.isSuccessful) {
                    val announcements = response.body() ?: emptyList()
                    // Sort by creation date descending
                    val sortedList = announcements.sortedByDescending { it.createdAt ?: OffsetDateTime.MIN }
                    announcementsAdapter.submitList(sortedList)
                    updateEmptyStateVisibility(sortedList.isEmpty())

                } else {
                    Log.e("Announcements", "API Error: ${response.code()} - ${response.message()}")
                    if(isAdded) Toast.makeText(requireContext(), "Failed to load announcements: ${response.code()}", Toast.LENGTH_SHORT).show()
                    announcementsAdapter.submitList(emptyList()) // Clear list on error
                    updateEmptyStateVisibility(true)
                }

            } catch (e: Exception) {
                if (isAdded) {
                    Log.e("Announcements", "Exception: ${e.message}", e)
                    if (e !is kotlinx.coroutines.CancellationException) {
                        Toast.makeText(requireContext(), "Error loading announcements: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
                    }
                    announcementsAdapter.submitList(emptyList()) // Clear list on error
                    updateEmptyStateVisibility(true)
                }
            } finally {
                setLoadingState(false) // Hide loading
            }
        }
    }

    // Show/hide loading indicators
    private fun setLoadingState(isLoading: Boolean) {
        if (!isAdded) return
        if (::progressBar.isInitialized) {
            progressBar.visibility = if (isLoading && !swipeRefreshLayout.isRefreshing) View.VISIBLE else View.GONE
        }
        if (!isLoading && ::swipeRefreshLayout.isInitialized) {
            swipeRefreshLayout.isRefreshing = false
        }
    }

    // Show/hide empty state view and RecyclerView
    private fun updateEmptyStateVisibility(isEmpty: Boolean) {
        if (!isAdded) return
        if (::recyclerView.isInitialized && ::emptyStateView.isInitialized) {
            recyclerView.visibility = if (isEmpty) View.GONE else View.VISIBLE
            emptyStateView.visibility = if (isEmpty) View.VISIBLE else View.GONE
        }
    }

    // Removed getSampleAnnouncements()
    // Removed filterAnnouncements()

    // --- New RecyclerView Adapter using ListAdapter ---
    inner class AnnouncementAdapter(
        private val onItemClicked: (AnnouncementResponse) -> Unit
    ) : ListAdapter<AnnouncementResponse, AnnouncementAdapter.ViewHolder>(AnnouncementDiffCallback()) {

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_announcement, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val announcement = getItem(position)
            holder.bind(announcement)
        }

        inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            // Removed categoryView TextView reference
            private val titleView: TextView = itemView.findViewById(R.id.announcement_title)
            private val dateView: TextView = itemView.findViewById(R.id.announcement_date)
            private val contentView: TextView = itemView.findViewById(R.id.announcement_content)
            private val imageView: ImageView = itemView.findViewById(R.id.announcement_image)
            private val btnShare: Button = itemView.findViewById(R.id.btn_share)
            private val btnViewDetails: Button = itemView.findViewById(R.id.btn_view_details)
            private val cardRoot: View = itemView.findViewById(R.id.announcement_card_root)

            fun bind(announcement: AnnouncementResponse) {
                titleView.text = announcement.title ?: "No Title"
                
                // Format date with time
                announcement.createdAt?.let { date ->
                    val formattedDate = date.format(DateTimeFormatter.ofPattern("MMMM d, yyyy"))
                    val formattedTime = date.format(DateTimeFormatter.ofPattern("h:mm a"))
                    dateView.text = "$formattedDate at $formattedTime"
                } ?: run {
                    dateView.text = "No Date"
                }
                
                contentView.text = announcement.content ?: "No Content"

                btnShare.setOnClickListener {
                    shareAnnouncement(announcement)
                }

                btnViewDetails.setOnClickListener {
                    onItemClicked(announcement)
                }

                cardRoot.setOnClickListener {
                    onItemClicked(announcement)
                }
            }
        }
    }

    // DiffUtil Callback for ListAdapter
    class AnnouncementDiffCallback : DiffUtil.ItemCallback<AnnouncementResponse>() {
        override fun areItemsTheSame(oldItem: AnnouncementResponse, newItem: AnnouncementResponse): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: AnnouncementResponse, newItem: AnnouncementResponse): Boolean {
            return oldItem == newItem // Compare based on data class equals()
        }
    }


    // --- Utility Functions ---

    private fun shareAnnouncement(announcement: AnnouncementResponse) {
        if (!isAdded) return
        val shareIntent = Intent(Intent.ACTION_SEND)
        shareIntent.type = "text/plain"
        shareIntent.putExtra(Intent.EXTRA_SUBJECT, "[Barangay360] ${announcement.title ?: "Announcement"}")

        val displayDate = announcement.updatedAt ?: announcement.createdAt
        val dateString = displayDate?.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM)) ?: "N/A"

        val shareContent = """
            ${announcement.title ?: "Announcement"}
            Date: $dateString

            ${announcement.content ?: ""}

            - Shared from Barangay360 App
        """.trimIndent()

        shareIntent.putExtra(Intent.EXTRA_TEXT, shareContent)
        startActivity(Intent.createChooser(shareIntent, "Share Announcement"))
    }

    private fun viewAnnouncementDetails(announcement: AnnouncementResponse) {
        if (!isAdded) return
        // Replace with actual navigation or dialog later
        Toast.makeText(
            requireContext(),
            "Viewing announcement: ${announcement.title ?: "N/A"}",
            Toast.LENGTH_SHORT
        ).show()
    }
}