package com.example.barangay360_mobile

import android.content.Intent
import android.os.Bundle
import com.example.barangay360_mobile.util.ThemeManager
import android.os.Handler
import android.os.Looper
import android.view.MenuItem
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
    private lateinit var bottomAppBar: BottomAppBar  // Add this declaration

    override fun onCreate(savedInstanceState: Bundle?) {
        ThemeManager.initialize(this)

        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        // Setup toolbar
        val toolbar: Toolbar = findViewById(R.id.toolbar)
        setSupportActionBar(toolbar)

        // Setup drawer layout
        drawerLayout = findViewById(R.id.drawer_layout)
        val navigationView: NavigationView = findViewById(R.id.nav_view)
        navigationView.setNavigationItemSelectedListener(this)

        // Add hamburger icon for drawer
        val toggle = ActionBarDrawerToggle(
            this, drawerLayout, toolbar,
            R.string.open_nav, R.string.close_nav
        )
        drawerLayout.addDrawerListener(toggle)
        toggle.syncState()

        // Initialize bottomAppBar - Add this line
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
            when (item.itemId) {
                R.id.home -> {
                    // Navigate to HomeFragment
                    replaceFragment(HomeFragment())
                    true
                }
                R.id.announcements -> {
                    // Navigate to AnnouncementFragment
                    replaceFragment(AnnouncementFragment())
                    true
                }
                R.id.services -> {
                    // Navigate to ServicesFragment
                    replaceFragment(ServicesFragment())
                    true
                }
                R.id.profile -> {
                    // Navigate to ProfileFragment
                    replaceFragment(ProfileFragment())
                    true
                }

                else -> false
            }
        }

        // If this is the first time the activity is loaded, show the home fragment
        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction().replace(R.id.fragment_container, HomeFragment()).commit()
            navigationView.setCheckedItem(R.id.nav_home)
            bottomNavigationView.selectedItemId = R.id.home
        }

        // Force correct appearance mode based on current theme
        if (ThemeManager.isDarkModeEnabled(this)) {
            // In dark mode - ensure UI components use dark styling
            // (They should do this automatically with proper theme settings)
        } else {
            // In light mode - force light styling
            navigationView.setBackgroundColor(getColor(R.color.white))
            bottomAppBar.setBackgroundColor(getColor(R.color.white))
            bottomNavigationView.setBackgroundColor(getColor(R.color.white))
        }
    }

    // Handle navigation item selection from the navigation drawer
    override fun onNavigationItemSelected(item: MenuItem): Boolean {
        // Highlight the selected item immediately for visual feedback
        item.isChecked = true

        // Create handler for delayed operations
        val handler = Handler(Looper.getMainLooper())

        // Wait 1 second before executing navigation
        handler.postDelayed({
            when (item.itemId) {
                R.id.nav_home -> {
                    // Navigate to HomeFragment
                    replaceFragment(HomeFragment())
                    bottomNavigationView.selectedItemId = R.id.home
                }
                R.id.nav_services -> {
                    // Navigate to SettingsFragment
                    replaceFragment(ServicesFragment())
                }
                R.id.nav_announcements -> {
                    // Navigate to SettingsFragment
                    replaceFragment(AnnouncementFragment())
                }
                R.id.nav_profile -> {
                    // Navigate to ShareFragment
                    replaceFragment(ProfileFragment())
                }
                R.id.nav_settings -> {
                    // Navigate to SettingsFragment
                    replaceFragment(SettingsFragment())
                }
                R.id.nav_about -> {
                    // Navigate to AboutFragment
                    replaceFragment(AboutFragment())
                }
                R.id.nav_logout -> {
                    // Replace this with the actual logout method call
                    Toast.makeText(this, "Logging out...", Toast.LENGTH_SHORT).show()
                    logout() // Call the logout method
                }
            }
            // Close the navigation drawer after the delay
            drawerLayout.closeDrawer(GravityCompat.START)
        }, 300) // 3 millisecond delay (300ms)

        // Don't close the drawer immediately - it will close after delay
        return true
    }

    // Replace the current fragment with the specified fragment
    private fun replaceFragment(fragment: Fragment) {
        supportFragmentManager.beginTransaction().replace(
            R.id.fragment_container,
            fragment
        ).commit()
    }

    // Handle back button press
    override fun onBackPressed() {
        if (drawerLayout.isDrawerOpen(GravityCompat.START)) {
            drawerLayout.closeDrawer(GravityCompat.START)
        } else {
            super.onBackPressed()
        }
    }

    // Add this method to your existing HomeActivity
// Call this when user wants to logout
    private fun logout() {
        val sessionManager = SessionManager(this)
        sessionManager.clearSession()

        // Navigate back to login screen
        val intent = Intent(this, SignInActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}