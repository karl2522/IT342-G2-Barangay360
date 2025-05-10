// File: com/example/barangay360_mobile/HomeFragment.kt
package com.example.barangay360_mobile

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.cardview.widget.CardView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
// import androidx.navigation.fragment.findNavController // Uncomment if you use NavController for other actions
import com.bumptech.glide.Glide
import com.example.barangay360_mobile.api.ApiClient
import com.example.barangay360_mobile.api.models.AnnouncementResponse
import com.example.barangay360_mobile.api.models.CommunityPostResponse
import com.example.barangay360_mobile.api.models.EventResponse
import com.example.barangay360_mobile.databinding.FragmentHomeBinding
import com.example.barangay360_mobile.util.SessionManager
import com.google.android.material.bottomnavigation.BottomNavigationView
import kotlinx.coroutines.launch
import java.time.LocalDateTime
import java.time.OffsetDateTime // Keep for announcements if used
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    private lateinit var sessionManager: SessionManager
    private var displayedCommunityPost: CommunityPostResponse? = null

    // Views for the Event Card on Dashboard
    private lateinit var cardNews: CardView
    private lateinit var imgNews: ImageView
    private lateinit var txtNewsTitle: TextView
    private lateinit var txtNewsDate: TextView
    private lateinit var txtNewsSummary: TextView
    private lateinit var btnViewAllNews: TextView
    private lateinit var txtNoUpcomingEvent: TextView

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        sessionManager = SessionManager.getInstance()
        try {
            cardNews = binding.cardNews // Example ID, adjust to your XML
            imgNews = binding.imgNews // Example ID
            txtNewsTitle = binding.txtNewsTitle // Example ID
            txtNewsDate = binding.txtNewsDate // Example ID
            txtNewsSummary = binding.txtNewsSummary // Example ID
            btnViewAllNews = binding.btnViewAllNews // Example ID
            txtNoUpcomingEvent = binding.txtNoUpcomingEvent // Example ID
        } catch (e: Exception) { // Catch generic exception if specific binding field isn't found
            Log.e("HomeFragment", "ViewBinding: Error initializing event card views. Check IDs in fragment_home.xml.", e)
            Toast.makeText(context, "Error initializing dashboard event views. Layout might be incorrect.", Toast.LENGTH_LONG).show()
        }
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        updateWelcomeMessage()
        setupUIListeners()
        refreshAllContent()
    }

    private fun setupUIListeners() {
        binding.swipeRefreshLayout.setColorSchemeResources(
            R.color.maroon,
            android.R.color.holo_green_dark,
            android.R.color.holo_blue_dark
        )
        binding.swipeRefreshLayout.setOnRefreshListener {
            refreshAllContent()
        }

        binding.btnViewAllAnnouncements.setOnClickListener {
            navigateToFragment(AnnouncementFragment.newInstance(), R.id.announcements)
        }

        if (binding.cardCommunity.visibility == View.VISIBLE || displayedCommunityPost != null) {
            binding.cardCommunity.setOnClickListener {
                navigateToFragment(CommunityFragment.newInstance(), R.id.nav_community)
            }
        }


        binding.btnViewProfile.setOnClickListener {
            (activity as? HomeActivity)?.findViewById<BottomNavigationView>(R.id.bottomNavigationView)?.selectedItemId = R.id.profile
        }

        if (::btnViewAllNews.isInitialized) {
            btnViewAllNews.setOnClickListener {
                val eventFragment = EventFragment.newInstance() // Make sure EventFragment.newInstance() exists
                parentFragmentManager.beginTransaction()
                    .replace(R.id.fragment_container, eventFragment)
                    .addToBackStack(null)
                    .commit()
            }
        } else {
            Log.e("HomeFragment", "btnViewAllNews (for events) was not initialized. Check XML ID.")
        }
    }

    private fun navigateToFragment(fragment: Fragment, bottomNavIdToSelect: Int?) {
        parentFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, fragment)
            .addToBackStack(null)
            .commit()
        bottomNavIdToSelect?.let {
            (activity as? HomeActivity)?.findViewById<BottomNavigationView>(R.id.bottomNavigationView)?.selectedItemId = it
        }
    }

    private fun updateWelcomeMessage() {
        val firstName = sessionManager.getFirstName() ?: ""
        val lastName = sessionManager.getLastName() ?: ""
        val displayName = when {
            firstName.isNotEmpty() && lastName.isNotEmpty() -> "$firstName $lastName"
            firstName.isNotEmpty() -> firstName
            lastName.isNotEmpty() -> lastName
            else -> "Resident"
        }
        binding.txtWelcome.text = "Welcome, $displayName!"
    }

    private fun refreshAllContent() {
        updateWelcomeMessage()
        fetchMostRecentAnnouncement() // Your existing function
        fetchMostRecentCommunityPost() // Your existing function
        fetchDashboardEvent()          // Function to fetch and filter events
    }

    private fun fetchMostRecentAnnouncement() {
        if (!binding.swipeRefreshLayout.isRefreshing && isAdded) {
            binding.swipeRefreshLayout.isRefreshing = true
        }

        val token = sessionManager.getAuthToken()
        if (token == null) {
            Log.w("HomeFragment", "Auth token is null. Cannot fetch announcements.")
            if (isAdded) {
                binding.cardAnnouncement.visibility = View.GONE
                binding.cardNoAnnouncement.visibility = View.VISIBLE
            }
            // Don't set isRefreshing to false here; let the final fetch in refreshAllContent handle it.
            return
        }

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val response = ApiClient.announcementService.getAnnouncements()
                if (!isAdded) return@launch

                if (response.isSuccessful) {
                    val announcements = response.body()
                    if (!announcements.isNullOrEmpty()) {
                        val sortedAnnouncements = announcements.sortedByDescending { it.createdAt ?: OffsetDateTime.MIN }
                        val mostRecent = sortedAnnouncements.first()
                        binding.txtAnnouncementTitle.text = mostRecent.title ?: "No Title"
                        binding.txtAnnouncementDate.text = mostRecent.createdAt?.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM)) ?: "No Date"
                        binding.txtAnnouncementContent.text = mostRecent.content ?: "No Content"
                        binding.cardAnnouncement.visibility = View.VISIBLE
                        binding.cardNoAnnouncement.visibility = View.GONE
                    } else {
                        binding.cardAnnouncement.visibility = View.GONE
                        binding.cardNoAnnouncement.visibility = View.VISIBLE
                    }
                } else {
                    if(isAdded) { // Check isAdded before showing Toast
                        Toast.makeText(requireContext(), "Failed to load announcements: ${response.code()}", Toast.LENGTH_SHORT).show()
                        binding.cardAnnouncement.visibility = View.GONE
                        binding.cardNoAnnouncement.visibility = View.VISIBLE
                    }
                }
            } catch (e: Exception) {
                if(isAdded){ // Check isAdded before showing Toast or modifying UI
                    if (e !is kotlinx.coroutines.CancellationException) {
                        Toast.makeText(requireContext(), "Error loading announcements: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
                    }
                    binding.cardAnnouncement.visibility = View.GONE
                    binding.cardNoAnnouncement.visibility = View.VISIBLE
                }
            }
            // SwipeRefreshLayout's isRefreshing is managed by the last fetch call in refreshAllContent
        }
    }

    private fun fetchMostRecentCommunityPost() {
        // Your existing code for fetching community posts.
        // Make sure to handle binding.swipeRefreshLayout.isRefreshing correctly.
        if (!sessionManager.isLoggedIn()) {
            Log.w("HomeFragment", "Not logged in, cannot fetch community post for dashboard.")
            if(isAdded) binding.cardCommunity.visibility = View.GONE
            // Don't set isRefreshing to false here
            return
        }

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                // Fetch page 0, size 1 to get the most recent post
                val response = ApiClient.communityFeedService.getCommunityPosts(page = 0, size = 1)
                if (!isAdded) return@launch

                if (response.isSuccessful) {
                    val pageResponse = response.body()
                    val posts = pageResponse?.content
                    if (!posts.isNullOrEmpty()) {
                        displayedCommunityPost = posts.first()
                        displayCommunityPostOnDashboard(displayedCommunityPost)
                        binding.cardCommunity.visibility = View.VISIBLE
                    } else {
                        Log.i("HomeFragment", "No community posts found to display on dashboard.")
                        binding.cardCommunity.visibility = View.GONE
                    }
                } else {
                    Log.e("HomeFragment", "Failed to fetch community posts for dashboard: ${response.code()}")
                    if(isAdded) binding.cardCommunity.visibility = View.GONE
                }
            } catch (e: Exception) {
                if (isAdded && e !is kotlinx.coroutines.CancellationException) {
                    Log.e("HomeFragment", "Error fetching community post for dashboard: ${e.message}", e)
                }
                if(isAdded) binding.cardCommunity.visibility = View.GONE
            }
            // SwipeRefreshLayout's isRefreshing is managed by the last fetch call in refreshAllContent
        }
    }

    private fun fetchDashboardEvent() {
        if (!binding.swipeRefreshLayout.isRefreshing && isAdded) {
            binding.swipeRefreshLayout.isRefreshing = true
        }

        val token = sessionManager.getAuthToken()
        if (token == null) {
            Log.w("HomeFragment", "Auth token is null for fetching dashboard event.")
            if (isAdded && ::cardNews.isInitialized && ::txtNoUpcomingEvent.isInitialized) {
                cardNews.visibility = View.GONE
                txtNoUpcomingEvent.visibility = View.VISIBLE
            }
            if(isAdded) binding.swipeRefreshLayout.isRefreshing = false // This is the last call in refreshAllContent
            return
        }

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val response = ApiClient.eventService.getAllEvents() // Fetch ALL events
                if (!isAdded) return@launch // Guard against fragment not being attached

                if (response.isSuccessful) {
                    val allEvents = response.body() ?: emptyList()
                    val now = LocalDateTime.now()

                    // Filter for upcoming events and sort them by start date (soonest first)
                    val upcomingEvents = allEvents
                        .filter { it.start != null && it.start.isAfter(now) }
                        .sortedBy { it.start }

                    if (upcomingEvents.isNotEmpty() && ::cardNews.isInitialized && ::txtNoUpcomingEvent.isInitialized) {
                        val mostRecentUpcomingEvent = upcomingEvents.first()
                        displayEventOnCard(mostRecentUpcomingEvent)
                        cardNews.visibility = View.VISIBLE
                        txtNoUpcomingEvent.visibility = View.GONE
                    } else if (::cardNews.isInitialized && ::txtNoUpcomingEvent.isInitialized) {
                        // No upcoming events found
                        cardNews.visibility = View.GONE
                        txtNoUpcomingEvent.visibility = View.VISIBLE
                        Log.i("HomeFragment", "No upcoming events found for the dashboard event card.")
                    }
                } else {
                    Log.e("HomeFragment", "Error fetching events for dashboard: ${response.code()} - ${response.message()}")
                    if(isAdded && ::cardNews.isInitialized && ::txtNoUpcomingEvent.isInitialized) {
                        Toast.makeText(context, "Failed to load upcoming event.", Toast.LENGTH_SHORT).show()
                        cardNews.visibility = View.GONE
                        txtNoUpcomingEvent.visibility = View.VISIBLE
                    }
                }
            } catch (e: Exception) {
                if(isAdded && ::cardNews.isInitialized && ::txtNoUpcomingEvent.isInitialized) {
                    Log.e("HomeFragment", "Exception fetching events for dashboard: ${e.message}", e)
                    if (e !is kotlinx.coroutines.CancellationException) {
                        Toast.makeText(context, "Error loading upcoming event.", Toast.LENGTH_SHORT).show()
                    }
                    cardNews.visibility = View.GONE
                    txtNoUpcomingEvent.visibility = View.VISIBLE
                }
            } finally {
                if (isAdded) {
                    binding.swipeRefreshLayout.isRefreshing = false // Ensure this is called
                }
            }
        }
    }

    private fun displayEventOnCard(event: EventResponse) {
        // Check if views are initialized before using them
        if (!isAdded || _binding == null ||
            !::txtNewsTitle.isInitialized || !::txtNewsSummary.isInitialized ||
            !::txtNewsDate.isInitialized || !::imgNews.isInitialized) {
            Log.w("HomeFragment", "displayEventOnCard called but views are not ready or fragment detached.")
            return
        }

        txtNewsTitle.text = event.title ?: "Upcoming Event"
        txtNewsSummary.text = event.description ?: "No description provided."
        txtNewsDate.text = formatEventDateTime(event.start, event.end, event.allDay ?: false)

        Glide.with(this)
            .load(R.drawable.ic_event) // Replace with your generic event drawable
            .placeholder(R.drawable.barangay360_logo) // Fallback placeholder
            .error(R.drawable.barangay_people_crowd)       // Image if loading fails
            .into(imgNews)
    }

    private fun formatEventDateTime(start: LocalDateTime?, end: LocalDateTime?, allDay: Boolean): String {
        if (start == null) return "Date/Time TBD"

        val dateFormatter = DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(Locale.getDefault())
        val timeFormatter = DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT).withLocale(Locale.getDefault())

        val startDateStr = start.format(dateFormatter)
        val startTimeStr = start.format(timeFormatter)

        return if (allDay) {
            if (end != null && start.toLocalDate() != end.toLocalDate()) {
                "$startDateStr - ${end.format(dateFormatter)}"
            } else {
                startDateStr
            }
        } else {
            val endTimeStr = end?.format(timeFormatter) ?: ""
            if (end != null && start.toLocalDate() != end.toLocalDate()) {
                "$startDateStr, $startTimeStr - ${end.format(dateFormatter)}, $endTimeStr"
            } else if (end != null && startTimeStr != endTimeStr) {
                "$startDateStr, $startTimeStr - $endTimeStr"
            } else {
                "$startDateStr, $startTimeStr"
            }
        }
    }

    private fun displayCommunityPostOnDashboard(post: CommunityPostResponse?) {
        if (!isAdded || _binding == null || post == null) {
            if (isAdded && _binding != null && _binding?.cardCommunity != null) { // Check specific view if possible
                binding.cardCommunity.visibility = View.GONE
            }
            return
        }

        val authorName = post.author?.let { "${it.firstName ?: ""} ${it.lastName ?: ""}".trim() }
            ?: post.author?.username
            ?: "Anonymous"

        binding.communityUserName.text = authorName
        binding.communityTitle.text = post.title ?: "No Title"
        binding.communityDescription.text = post.content ?: "No content to display."
        binding.communityDescription.maxLines = 3 // Keep it concise for dashboard

        post.createdAt?.let {
            try {
                val formatter = DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM).withLocale(Locale.getDefault())
                binding.communityPostDate.text = "Posted: ${it.format(formatter)}"
            } catch (e: Exception) { binding.communityPostDate.text = "Date unavailable" }
        } ?: run { binding.communityPostDate.text = "Date unavailable" }

        binding.likeCount.text = "${post.actualLikesCount} likes"
        binding.commentCount.text = "${post.actualCommentsCount} comments"

        val dashboardPostImageView: ImageView = binding.ivPostImageDashboard
        val defaultDashboardImageResId = R.drawable.barangay_people_crowd // Your desired default image

        if (!post.imageUrl.isNullOrBlank()) {
            dashboardPostImageView.visibility = View.VISIBLE
            Glide.with(this)
                .load(post.imageUrl)
                .placeholder(R.drawable.barangay360_logo)
                .error(defaultDashboardImageResId)
                .into(dashboardPostImageView)
        } else {
            dashboardPostImageView.visibility = View.VISIBLE // Show default if no image URL
            Glide.with(this)
                .load(defaultDashboardImageResId)
                .into(dashboardPostImageView)
        }
        binding.cardCommunity.visibility = View.VISIBLE
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null // Important for view binding to avoid memory leaks
    }

    companion object {
        @JvmStatic // Add this if you want to call HomeFragment.newInstance() from Java code too
        fun newInstance() = HomeFragment()
    }
}