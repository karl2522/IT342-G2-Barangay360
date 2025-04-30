package com.example.barangay360_mobile

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.cardview.widget.CardView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.example.barangay360_mobile.api.ApiClient
import com.example.barangay360_mobile.api.models.AnnouncementResponse
import com.example.barangay360_mobile.util.SessionManager
import com.google.android.material.bottomnavigation.BottomNavigationView
import kotlinx.coroutines.launch
import java.time.OffsetDateTime // Import OffsetDateTime
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle


class HomeFragment : Fragment() {

    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var welcomeTextView: TextView
    private lateinit var sessionManager: SessionManager

    // Views for Announcement Card
    private lateinit var announcementCard: CardView
    private lateinit var announcementTitle: TextView
    private lateinit var announcementDate: TextView
    private lateinit var announcementContent: TextView
    private lateinit var viewAllAnnouncementsButton: Button

    // **** ADD REFERENCE FOR PLACEHOLDER ****
    private lateinit var noAnnouncementCard: CardView

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_home, container, false)

        sessionManager = SessionManager.getInstance()
        welcomeTextView = view.findViewById(R.id.txt_welcome)
        updateWelcomeMessage()

        // Initialize Announcement Views
        announcementCard = view.findViewById(R.id.card_announcement)
        announcementTitle = view.findViewById(R.id.txt_announcement_title)
        announcementDate = view.findViewById(R.id.txt_announcement_date)
        announcementContent = view.findViewById(R.id.txt_announcement_content)
        viewAllAnnouncementsButton = view.findViewById(R.id.btn_view_all_announcements)

        // **** INITIALIZE PLACEHOLDER VIEW ****
        noAnnouncementCard = view.findViewById(R.id.card_no_announcement)

        // Hide both cards initially
        announcementCard.visibility = View.GONE
        noAnnouncementCard.visibility = View.GONE

        viewAllAnnouncementsButton.setOnClickListener {
            (activity as? HomeActivity)?.supportFragmentManager?.beginTransaction()
                ?.replace(R.id.fragment_container, AnnouncementFragment())
                ?.addToBackStack(null)
                ?.commit()
            (activity as? HomeActivity)?.findViewById<BottomNavigationView>(R.id.bottomNavigationView)?.selectedItemId = R.id.announcements
        }

        swipeRefreshLayout = view.findViewById(R.id.swipeRefreshLayout)
        swipeRefreshLayout.setColorSchemeResources(
            R.color.maroon,
            android.R.color.holo_green_dark,
            android.R.color.holo_blue_dark
        )
        swipeRefreshLayout.setOnRefreshListener {
            refreshHomeContent()
        }

        return view
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        fetchMostRecentAnnouncement()
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
        welcomeTextView.text = "Welcome, $displayName!"
    }

    private fun refreshHomeContent() {
        updateWelcomeMessage()
        fetchMostRecentAnnouncement()
    }

    private fun fetchMostRecentAnnouncement() {
        if (::swipeRefreshLayout.isInitialized) {
            swipeRefreshLayout.isRefreshing = true
        }

        val token = sessionManager.getAuthToken()
        if (token == null) {
            Log.w("HomeFragment", "Auth token is null. Cannot fetch announcements.")
            if (isAdded) {
                if (::announcementCard.isInitialized) announcementCard.visibility = View.GONE
                if (::noAnnouncementCard.isInitialized) noAnnouncementCard.visibility = View.GONE
            }
            if (::swipeRefreshLayout.isInitialized) {
                swipeRefreshLayout.isRefreshing = false
            }
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

                        if (::announcementCard.isInitialized && ::noAnnouncementCard.isInitialized) {
                            announcementTitle.text = mostRecent.title ?: "No Title"
                            announcementDate.text = mostRecent.createdAt?.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM)) ?: "No Date"
                            announcementContent.text = mostRecent.content ?: "No Content"
                            announcementCard.visibility = View.VISIBLE
                            noAnnouncementCard.visibility = View.GONE
                        }
                    } else {
                        Log.i("HomeFragment", "No announcements found from API.")
                        if (::announcementCard.isInitialized && ::noAnnouncementCard.isInitialized) {
                            announcementCard.visibility = View.GONE
                            noAnnouncementCard.visibility = View.VISIBLE
                        }
                    }
                } else {
                    Log.e("HomeFragment", "API Error fetching announcements: ${response.code()} - ${response.message()}")
                    if (isAdded) {
                        Toast.makeText(requireContext(), "Failed to load announcements: ${response.code()}", Toast.LENGTH_SHORT).show()
                        if (::announcementCard.isInitialized) announcementCard.visibility = View.GONE
                        if (::noAnnouncementCard.isInitialized) noAnnouncementCard.visibility = View.GONE
                    }
                }
            } catch (e: Exception) {
                if (isAdded) {
                    Log.e("HomeFragment", "Exception fetching announcements: ${e.message}", e)
                    if (e !is kotlinx.coroutines.CancellationException) {
                        Toast.makeText(requireContext(), "Error loading announcements: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
                    }
                    if (::announcementCard.isInitialized) announcementCard.visibility = View.GONE
                    if (::noAnnouncementCard.isInitialized) noAnnouncementCard.visibility = View.GONE
                }
            } finally {
                if (isAdded && ::swipeRefreshLayout.isInitialized) {
                    swipeRefreshLayout.isRefreshing = false
                }
            }
        }
    }
}