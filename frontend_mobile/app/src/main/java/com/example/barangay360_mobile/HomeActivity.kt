package com.example.barangay360_mobile

import android.content.Intent
import android.os.Bundle
import com.example.barangay360_mobile.util.ThemeManager
import android.os.Handler
import android.os.Looper
import android.view.MenuItem
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.ActionBarDrawerToggle
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import androidx.fragment.app.Fragment
import com.example.barangay360_mobile.util.SessionManager
import com.google.android.material.bottomappbar.BottomAppBar
import com.google.android.material.navigation.NavigationView
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.android.material.floatingactionbutton.FloatingActionButton

class HomeActivity : AppCompatActivity(), NavigationView.OnNavigationItemSelectedListener {

    private lateinit var drawerLayout: DrawerLayout
    private lateinit var bottomNavigationView: BottomNavigationView
    private lateinit var fab: FloatingActionButton
    private lateinit var bottomAppBar: BottomAppBar
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        ThemeManager.initialize(this)

        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        // Initialize SessionManager
        sessionManager = SessionManager.getInstance()

        // Setup toolbar
        val toolbar: Toolbar = findViewById(R.id.toolbar)
        setSupportActionBar(toolbar)

        // Setup drawer layout
        drawerLayout = findViewById(R.id.drawer_layout)
        val navigationView: NavigationView = findViewById(R.id.nav_view)
        navigationView.setNavigationItemSelectedListener(this)

        // Setup navigation header with user data
        setupNavigationHeader(navigationView)

        // Add hamburger icon for drawer
        val toggle = ActionBarDrawerToggle(
            this, drawerLayout, toolbar,
            R.string.open_nav, R.string.close_nav
        )
        drawerLayout.addDrawerListener(toggle)
        toggle.syncState()

        // Initialize bottomAppBar
        bottomAppBar = findViewById(R.id.bottomAppBar)

        // Setup floating action button for QR scanner
        fab = findViewById(R.id.fab)
        fab.setImageResource(R.drawable.bottom_qr_scan_icon) // Use your existing QR scan icon
        fab.setOnClickListener {
            // Launch your existing QRCodeScannerActivity
            val intent = Intent(this, QRCodeScannerActivity::class.java)
            startActivity(intent)
        }

        // Setup bottom navigation view
        bottomNavigationView = findViewById(R.id.bottomNavigationView)
        bottomNavigationView.background = null
        bottomNavigationView.menu.getItem(2).isEnabled = false // Disable the middle item (camera placeholder)

        bottomNavigationView.setOnItemSelectedListener { item ->
            var selectedFragment: Fragment? = null // Initialize as null
            when (item.itemId) {
                R.id.home -> {
                    selectedFragment = HomeFragment()
                }
                R.id.announcements -> {
                    selectedFragment = AnnouncementFragment()
                }
                R.id.services -> {
                    selectedFragment = ServicesFragment() // This now contains MyServicesFragment
                }
                R.id.profile -> {
                    selectedFragment = ProfileFragment()
                }
            }
            // Replace fragment if one was selected
            selectedFragment?.let {
                replaceFragment(it)
                true // Return true as the selection was handled
            } ?: false // Return false if no fragment was selected (e.g., placeholder item)
        }


        // Check if we need to handle navigation from QR code scanner
        handleIntent(intent)

        // If this is the first time the activity is loaded and we're not handling a QR code intent,
        // show the home fragment
        if (savedInstanceState == null && !intent.hasExtra("navigate_to")) {
            supportFragmentManager.beginTransaction().replace(R.id.fragment_container, HomeFragment()).commit()
            navigationView.setCheckedItem(R.id.nav_home)
            bottomNavigationView.selectedItemId = R.id.home
        }

        // Force correct appearance mode based on current theme
        if (ThemeManager.isDarkModeEnabled(this)) {
            // In dark mode - ensure UI components use dark styling
        } else {
            // In light mode - force light styling
            navigationView.setBackgroundColor(getColor(R.color.white))
            bottomAppBar.setBackgroundColor(getColor(R.color.white))
            bottomNavigationView.setBackgroundColor(getColor(R.color.white))
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent) // Update the activity's intent
        handleIntent(intent)
    }


    private fun handleIntent(intent: Intent?) {
        intent?.let {
            if (it.hasExtra("navigate_to")) {
                when (it.getStringExtra("navigate_to")) {
                    "service_request" -> {
                        // Get the data from the intent
                        val serviceType = it.getStringExtra("service_type") ?: ""
                        val purpose = it.getStringExtra("purpose") ?: ""
                        val mode = it.getStringExtra("mode") ?: "form"
                        val userId = it.getLongExtra("user_id", 0)

                        // Create a bundle to pass data
                        val args = Bundle().apply {
                            putString("service_type", serviceType)
                            putString("purpose", purpose)
                            putString("mode", mode)
                            putLong("user_id", userId)
                        }

                        // Create and add ServicesFragment
                        val servicesFragment = ServicesFragment()
                        supportFragmentManager.beginTransaction()
                            .replace(R.id.fragment_container, servicesFragment)
                            .commit()

                        // Set bottom navigation to services tab
                        bottomNavigationView.selectedItemId = R.id.services

                        // Wait for fragment to be added before setting result
                        Handler(Looper.getMainLooper()).postDelayed({
                            supportFragmentManager.setFragmentResult("qrServiceData", args)
                        }, 100)

                        // Remove the handled extra to prevent re-processing on config change
                        it.removeExtra("navigate_to")
                    }
                    // Handle other navigation cases if needed
                }
            }
        }
    }

    private fun setupNavigationHeader(navigationView: NavigationView) {
        val headerView = navigationView.getHeaderView(0)
        val usernameTextView = headerView.findViewById<TextView>(R.id.nav_header_username)
        val emailTextView = headerView.findViewById<TextView>(R.id.nav_header_email)

        val firstName = sessionManager.getFirstName() ?: ""
        val lastName = sessionManager.getLastName() ?: ""
        val email = sessionManager.getUserEmail() ?: ""

        val fullName = "$firstName $lastName".trim()
        usernameTextView.text = if (fullName.isNotEmpty()) fullName else "User" // Fallback name
        emailTextView.text = email
    }

    override fun onNavigationItemSelected(item: MenuItem): Boolean {
        var selectedFragment: Fragment? = null
        var selectedBottomNavId: Int? = null // Track corresponding bottom nav item

        when (item.itemId) {
            R.id.nav_home -> {
                selectedFragment = HomeFragment()
                selectedBottomNavId = R.id.home
            }
            R.id.nav_services -> {
                selectedFragment = ServicesFragment()
                selectedBottomNavId = R.id.services // Select services bottom nav item
            }
            R.id.nav_announcements -> {
                selectedFragment = AnnouncementFragment()
                selectedBottomNavId = R.id.announcements
            }

            R.id.nav_community -> {
                selectedFragment = CommunityFragment()
            }
            R.id.nav_profile -> {
                selectedFragment = ProfileFragment()
                selectedBottomNavId = R.id.profile
            }
            R.id.nav_settings -> {
                selectedFragment = SettingsFragment()
                // No direct bottom nav item for settings, keep selection as is or default to home?
                // Keep current selection: selectedBottomNavId = bottomNavigationView.selectedItemId
                // Or default to home: selectedBottomNavId = R.id.home
            }
            R.id.nav_about -> {
                selectedFragment = AboutFragment()
                // No direct bottom nav item for about
            }
            R.id.nav_logout -> {
                logout()
            }
        }

        selectedFragment?.let {
            replaceFragment(it)
        }

        // Update bottom nav selection if a corresponding item exists
        selectedBottomNavId?.let {
            bottomNavigationView.selectedItemId = it
        }


        drawerLayout.closeDrawer(GravityCompat.START)
        return true // Return true to display the item as selected
    }


    private fun replaceFragment(fragment: Fragment) {
        supportFragmentManager.beginTransaction().replace(
            R.id.fragment_container,
            fragment
        ).commit()
    }

    override fun onBackPressed() {
        if (drawerLayout.isDrawerOpen(GravityCompat.START)) {
            drawerLayout.closeDrawer(GravityCompat.START)
        } else {
            // Check if the current fragment is NOT HomeFragment
            val currentFragment = supportFragmentManager.findFragmentById(R.id.fragment_container)
            if (currentFragment !is HomeFragment) {
                // If not Home, navigate to Home
                replaceFragment(HomeFragment())
                bottomNavigationView.selectedItemId = R.id.home // Update bottom nav
                // Ensure the drawer menu item is also checked if needed
                val navigationView: NavigationView = findViewById(R.id.nav_view)
                navigationView.setCheckedItem(R.id.nav_home)
            } else {
                // If already on Home, perform default back action (exit app)
                super.onBackPressed()
            }
        }
    }


    private fun logout() {
        sessionManager.clearSession()
        val intent = Intent(this, SignInActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finishAffinity() // Close all activities in the task associated with this activity
    }
}