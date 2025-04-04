package com.example.barangay360_mobile

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.Switch
import android.widget.Toast
import androidx.appcompat.widget.SwitchCompat
import androidx.fragment.app.Fragment
import com.example.barangay360_mobile.util.ThemeManager

class SettingsFragment : Fragment() {

    private lateinit var darkModeSwitch: SwitchCompat

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_settings, container, false)

        // Initialize dark mode switch
        darkModeSwitch = view.findViewById(R.id.switch_dark_mode)

        // Set switch initial state based on current theme
        darkModeSwitch.isChecked = ThemeManager.isDarkModeEnabled(requireContext())

        // Set up switch listener
        darkModeSwitch.setOnCheckedChangeListener { _, isChecked ->
            ThemeManager.toggleDarkMode(requireContext(), isChecked)

            // Optional: Show a toast message
            val message = if (isChecked) "Dark mode enabled" else "Light mode enabled"
            Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show()
        }

        // Set up other settings items click listeners
        setupSettingsClickListeners(view)

        return view
    }

    private fun setupSettingsClickListeners(view: View) {
        // Example: Profile settings click
        view.findViewById<LinearLayout>(R.id.setting_profile)?.setOnClickListener {
            // Navigate to profile settings
            // ...
        }

        // Example: About click
        view.findViewById<LinearLayout>(R.id.setting_about)?.setOnClickListener {
            requireActivity().supportFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, AboutFragment())
                .addToBackStack(null)
                .commit()
        }

        // Add other settings click listeners as needed
    }
}