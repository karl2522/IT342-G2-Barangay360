package com.example.barangay360_mobile

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.cardview.widget.CardView
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipGroup
import com.google.android.material.floatingactionbutton.FloatingActionButton

class AnnouncementFragment : Fragment() {

    // UI Components
    private lateinit var btnFilter: ImageButton
    private lateinit var filterScroll: View
    private lateinit var chipGroup: ChipGroup
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var recyclerView: RecyclerView
    private lateinit var emptyStateView: LinearLayout
    private lateinit var progressBar: ProgressBar
    private lateinit var fabAddAnnouncement: FloatingActionButton

    // Category types
    private val CATEGORY_ALL = "All"
    private val CATEGORY_EMERGENCY = "Emergency"
    private val CATEGORY_EVENTS = "Events"
    private val CATEGORY_SERVICES = "Services"
    private val CATEGORY_MAINTENANCE = "Maintenance"

    // Category colors
    private val COLOR_EMERGENCY = "#D32F2F" // Red
    private val COLOR_EVENTS = "#388E3C" // Green
    private val COLOR_SERVICES = "#1976D2" // Blue
    private val COLOR_MAINTENANCE = "#FFA000" // Amber

    // Current filter category
    private var currentCategory = CATEGORY_ALL
    private var announcements = listOf<Announcement>()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_announcement, container, false)

        // Initialize UI components
        btnFilter = view.findViewById(R.id.btn_filter)
        filterScroll = view.findViewById(R.id.filter_scroll)
        chipGroup = view.findViewById(R.id.filter_chip_group)
        swipeRefreshLayout = view.findViewById(R.id.swipeRefreshLayout)
        recyclerView = view.findViewById(R.id.recycler_announcements)
        emptyStateView = view.findViewById(R.id.empty_state)
        progressBar = view.findViewById(R.id.progress_bar)
        fabAddAnnouncement = view.findViewById(R.id.fab_add_announcement)

        // Set up RecyclerView
        recyclerView.layoutManager = LinearLayoutManager(context)

        // Setup filter button click
        btnFilter.setOnClickListener {
            toggleFilterVisibility()
        }

        // Setup chip group listener
        setupFilterChips(view)

        // Setup swipe refresh
        swipeRefreshLayout.setColorSchemeResources(R.color.maroon)
        swipeRefreshLayout.setOnRefreshListener {
            loadAnnouncements()
        }

        // Check if user is an admin/official to show FAB
        checkUserRole()

        // Setup FAB click
        fabAddAnnouncement.setOnClickListener {
            showAddAnnouncementDialog()
        }

        // Initial data load
        loadAnnouncements()

        return view
    }

    private fun toggleFilterVisibility() {
        if (filterScroll.visibility == View.VISIBLE) {
            filterScroll.visibility = View.GONE
        } else {
            filterScroll.visibility = View.VISIBLE
        }
    }

    private fun setupFilterChips(view: View) {
        val chipAll = view.findViewById<Chip>(R.id.chip_all)
        val chipEmergency = view.findViewById<Chip>(R.id.chip_emergency)
        val chipEvents = view.findViewById<Chip>(R.id.chip_events)
        val chipServices = view.findViewById<Chip>(R.id.chip_services)
        val chipMaintenance = view.findViewById<Chip>(R.id.chip_maintenance)

        chipGroup.setOnCheckedStateChangeListener { group, checkedIds ->
            if (checkedIds.isEmpty()) {
                // If no chip is selected, select "All" by default
                chipAll?.isChecked = true
                currentCategory = CATEGORY_ALL
            } else {
                when (checkedIds[0]) {
                    R.id.chip_all -> currentCategory = CATEGORY_ALL
                    R.id.chip_emergency -> currentCategory = CATEGORY_EMERGENCY
                    R.id.chip_events -> currentCategory = CATEGORY_EVENTS
                    R.id.chip_services -> currentCategory = CATEGORY_SERVICES
                    R.id.chip_maintenance -> currentCategory = CATEGORY_MAINTENANCE
                }
            }
            // Apply filter
            filterAnnouncements()
        }
    }

    private fun checkUserRole() {
        // Check user role from shared preferences or your auth system
        val sharedPreferences = requireActivity().getSharedPreferences("UserPrefs", 0)
        val isAdmin = sharedPreferences.getBoolean("isAdmin", false)

        if (isAdmin) {
            fabAddAnnouncement.visibility = View.VISIBLE
        } else {
            fabAddAnnouncement.visibility = View.GONE
        }
    }

    private fun showAddAnnouncementDialog() {
        // Navigate to announcement creation screen
        // findNavController().navigate(R.id.action_announcementFragment_to_createAnnouncementFragment)

        // For now, just show a toast
        Toast.makeText(context, "Create announcement feature coming soon", Toast.LENGTH_SHORT).show()
    }

    private fun loadAnnouncements() {
        // Show loading indicator
        progressBar.visibility = View.VISIBLE
        recyclerView.visibility = View.GONE
        emptyStateView.visibility = View.GONE

        // Simulate network delay
        view?.postDelayed({
            // Get announcements from your data source
            announcements = getSampleAnnouncements()

            if (announcements.isEmpty()) {
                // Show empty state
                showEmptyState()
            } else {
                // Show announcements
                showAnnouncements(announcements)
            }

            // Hide loading indicator
            progressBar.visibility = View.GONE

            // Complete refresh if it was a pull-to-refresh
            swipeRefreshLayout.isRefreshing = false
        }, 1000)
    }

    private fun showEmptyState() {
        recyclerView.visibility = View.GONE
        emptyStateView.visibility = View.VISIBLE
    }

    private fun showAnnouncements(announcements: List<Announcement>) {
        recyclerView.visibility = View.VISIBLE
        emptyStateView.visibility = View.GONE

        // Set adapter
        recyclerView.adapter = AnnouncementAdapter(announcements)
    }

    private fun filterAnnouncements() {
        val filteredAnnouncements = if (currentCategory == CATEGORY_ALL) {
            announcements
        } else {
            announcements.filter { it.category == currentCategory }
        }

        if (filteredAnnouncements.isEmpty()) {
            showEmptyState()
        } else {
            showAnnouncements(filteredAnnouncements)
        }
    }

    private fun getSampleAnnouncements(): List<Announcement> {
        // In a real app, you would fetch this from an API
        return listOf(
            Announcement(
                "1",
                CATEGORY_EMERGENCY,
                "Scheduled Power Outage",
                "March 30, 2025",
                "There will be a scheduled power interruption from 9:00 AM to 3:00 PM for electrical maintenance in the area.",
                null
            ),
            Announcement(
                "2",
                CATEGORY_EVENTS,
                "Barangay Cleanup Drive",
                "April 5, 2025",
                "Join us for our monthly community cleanup drive. Together, we can make our barangay clean and green!",
                null
            ),
            Announcement(
                "3",
                CATEGORY_SERVICES,
                "Free Medical Checkup",
                "April 10, 2025",
                "The barangay health center will be offering free medical checkups for all residents. Please bring your barangay ID.",
                null
            ),
            Announcement(
                "4",
                CATEGORY_MAINTENANCE,
                "Road Repairs",
                "April 12-15, 2025",
                "Road repairs will be conducted on Rizal Street. Please use alternative routes during this period.",
                null
            )
        )
    }

    // Data model for announcements
    data class Announcement(
        val id: String,
        val category: String,
        val title: String,
        val date: String,
        val content: String,
        val imageUrl: String?
    )

    // Adapter for announcements
    inner class AnnouncementAdapter(
        private val announcements: List<Announcement>
    ) : RecyclerView.Adapter<AnnouncementAdapter.ViewHolder>() {

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_announcement, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            holder.bind(announcements[position])
        }

        override fun getItemCount() = announcements.size

        inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            private val categoryView: TextView = itemView.findViewById(R.id.announcement_category)
            private val titleView: TextView = itemView.findViewById(R.id.announcement_title)
            private val dateView: TextView = itemView.findViewById(R.id.announcement_date)
            private val contentView: TextView = itemView.findViewById(R.id.announcement_content)
            private val imageView: ImageView = itemView.findViewById(R.id.announcement_image)
            private val btnShare: Button = itemView.findViewById(R.id.btn_share)
            private val btnViewDetails: Button = itemView.findViewById(R.id.btn_view_details)

            fun bind(announcement: Announcement) {
                // Set text values
                categoryView.text = announcement.category
                titleView.text = announcement.title
                dateView.text = announcement.date
                contentView.text = announcement.content

                // Set category color
                val backgroundColor = when (announcement.category) {
                    CATEGORY_EMERGENCY -> COLOR_EMERGENCY
                    CATEGORY_EVENTS -> COLOR_EVENTS
                    CATEGORY_SERVICES -> COLOR_SERVICES
                    CATEGORY_MAINTENANCE -> COLOR_MAINTENANCE
                    else -> COLOR_EMERGENCY
                }
                categoryView.setBackgroundColor(Color.parseColor(backgroundColor))

                // Handle image
                if (announcement.imageUrl != null) {
                    imageView.visibility = View.VISIBLE
                    // In a real app, you would use Glide or Picasso to load the image
                    // Glide.with(itemView.context).load(announcement.imageUrl).into(imageView)
                } else {
                    imageView.visibility = View.GONE
                }

                // Set button click listeners
                btnShare.setOnClickListener {
                    shareAnnouncement(announcement)
                }

                btnViewDetails.setOnClickListener {
                    viewAnnouncementDetails(announcement)
                }

                // Make the whole card clickable
                itemView.setOnClickListener {
                    viewAnnouncementDetails(announcement)
                }
            }
        }
    }

    private fun shareAnnouncement(announcement: Announcement) {
        // Create a share intent
        val shareIntent = Intent(Intent.ACTION_SEND)
        shareIntent.type = "text/plain"
        shareIntent.putExtra(Intent.EXTRA_SUBJECT, "[Barangay360] ${announcement.title}")

        // Prepare the content to share
        val shareContent = """
            ${announcement.title}
            Date: ${announcement.date}
            Category: ${announcement.category}
            
            ${announcement.content}
            
            - Shared from Barangay360 App
        """.trimIndent()

        shareIntent.putExtra(Intent.EXTRA_TEXT, shareContent)
        startActivity(Intent.createChooser(shareIntent, "Share Announcement"))
    }

    private fun viewAnnouncementDetails(announcement: Announcement) {
        // In a real app, you would use Navigation Component to navigate to details
        // val action = AnnouncementFragmentDirections.actionAnnouncementFragmentToAnnouncementDetailFragment(announcement.id)
        // findNavController().navigate(action)

        // For now, we'll show a Toast with the announcement details
        Toast.makeText(
            context,
            "Viewing announcement: ${announcement.title}",
            Toast.LENGTH_SHORT
        ).show()
    }
}