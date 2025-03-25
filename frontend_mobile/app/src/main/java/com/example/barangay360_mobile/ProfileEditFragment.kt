package com.example.barangay360_mobile

import android.app.DatePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import android.widget.Button
import android.widget.ImageView
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.google.android.material.bottomappbar.BottomAppBar
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class ProfileEditFragment : Fragment() {

    private lateinit var firstNameInput: TextInputEditText
    private lateinit var lastNameInput: TextInputEditText
    private lateinit var phoneNumberInput: TextInputEditText
    private lateinit var genderDropdown: AutoCompleteTextView
    private lateinit var dobInput: TextInputEditText
    private lateinit var addressInput: TextInputEditText
    private lateinit var usernameInput: TextInputEditText
    private lateinit var emailInput: TextInputEditText

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Hide bottom navigation as soon as this fragment is created
        hideBottomNavigation()
        return inflater.inflate(R.layout.fragment_profile_edit, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Initialize input fields
        firstNameInput = view.findViewById(R.id.first_name_input)
        lastNameInput = view.findViewById(R.id.last_name_input)
        phoneNumberInput = view.findViewById(R.id.phone_number_input)
        genderDropdown = view.findViewById(R.id.gender_dropdown)
        dobInput = view.findViewById(R.id.dob_input)
        addressInput = view.findViewById(R.id.address_input)
        usernameInput = view.findViewById(R.id.username_input)
        emailInput = view.findViewById(R.id.email_input)

        // Setup back button
        view.findViewById<ImageView>(R.id.btn_back).setOnClickListener {
            // Show bottom navigation before going back
            showBottomNavigation()
            // Navigate back to profile screen
            requireActivity().onBackPressed()
        }

        // Setup gender dropdown
        setupGenderDropdown()

        // Setup date picker
        setupDatePicker()

        // Setup profile image change
        view.findViewById<ImageView>(R.id.btn_change_photo)?.setOnClickListener {
            // Show image picker options (camera/gallery)
            showImagePickerDialog()
        }

        // Setup update button
        view.findViewById<Button>(R.id.btn_update_profile).setOnClickListener {
            updateProfile()
        }

        // Load current user data
        loadUserData()
    }

    override fun onResume() {
        super.onResume()
        // Make sure bottom navigation stays hidden if fragment resumes
        hideBottomNavigation()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        // Show bottom navigation again when leaving this fragment
        showBottomNavigation()
    }

    private fun hideBottomNavigation() {
        try {
            // Hide the bottom navigation view
            val bottomNavigationView = requireActivity().findViewById<BottomNavigationView>(R.id.bottomNavigationView)
            bottomNavigationView?.visibility = View.GONE

            // Hide the bottom app bar that contains it
            val bottomAppBar = requireActivity().findViewById<BottomAppBar>(R.id.bottomAppBar)
            bottomAppBar?.visibility = View.GONE

            // Also hide the floating action button
            val fab = requireActivity().findViewById<FloatingActionButton>(R.id.fab)
            fab?.visibility = View.GONE
        } catch (e: Exception) {
            // Handle any errors finding the views
            e.printStackTrace()
        }
    }

    private fun showBottomNavigation() {
        try {
            // Show the bottom navigation view
            val bottomNavigationView = requireActivity().findViewById<BottomNavigationView>(R.id.bottomNavigationView)
            bottomNavigationView?.visibility = View.VISIBLE

            // Show the bottom app bar that contains it
            val bottomAppBar = requireActivity().findViewById<BottomAppBar>(R.id.bottomAppBar)
            bottomAppBar?.visibility = View.VISIBLE

            // Also show the floating action button
            val fab = requireActivity().findViewById<FloatingActionButton>(R.id.fab)
            fab?.visibility = View.VISIBLE
        } catch (e: Exception) {
            // Handle any errors finding the views
            e.printStackTrace()
        }
    }

    private fun setupGenderDropdown() {
        val genders = arrayOf("Male", "Female", "Prefer not to say")
        val adapter = ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, genders)
        genderDropdown.setAdapter(adapter)
    }

    private fun setupDatePicker() {
        dobInput.setOnClickListener {
            // Show date picker dialog
            showDatePickerDialog()
        }
    }

    private fun showDatePickerDialog() {
        val calendar = Calendar.getInstance()

        // Try to parse existing date if available
        try {
            val dateText = dobInput.text.toString()
            if (dateText.isNotEmpty()) {
                val dateFormat = SimpleDateFormat("MMMM d, yyyy", Locale.getDefault())
                val date = dateFormat.parse(dateText)
                if (date != null) {
                    calendar.time = date
                }
            }
        } catch (e: Exception) {
            // Use current date if parsing fails
            e.printStackTrace()
        }

        val year = calendar.get(Calendar.YEAR)
        val month = calendar.get(Calendar.MONTH)
        val day = calendar.get(Calendar.DAY_OF_MONTH)

        val datePickerDialog = DatePickerDialog(
            requireContext(),
            { _, selectedYear, selectedMonth, selectedDay ->
                // Format the date and set it to the input field
                val selectedDate = formatDate(selectedYear, selectedMonth, selectedDay)
                dobInput.setText(selectedDate)
            },
            year, month, day
        )

        // Set max date to current date (no future dates)
        datePickerDialog.datePicker.maxDate = System.currentTimeMillis()

        datePickerDialog.show()
    }

    private fun formatDate(year: Int, month: Int, day: Int): String {
        val calendar = Calendar.getInstance()
        calendar.set(year, month, day)
        val dateFormat = SimpleDateFormat("MMMM d, yyyy", Locale.getDefault())
        return dateFormat.format(calendar.time)
    }

    private fun loadUserData() {
        // In a real app, you would load this data from your user repository or API
        // For now, we'll use hardcoded values that match the Profile screen
        firstNameInput.setText("John")
        lastNameInput.setText("Doe")
        phoneNumberInput.setText("+63 912 345 6789")
        genderDropdown.setText("Male", false)
        dobInput.setText("January 1, 1990")
        addressInput.setText("123 Main St, Cebu City, Philippines")
        usernameInput.setText("johndoe123")
        emailInput.setText("johndoe@example.com")
    }

    private fun showImagePickerDialog() {
        // In a real app, you would implement an image picker here
        // For simplicity, we'll just show a toast
        Toast.makeText(requireContext(), "Image picker would open here", Toast.LENGTH_SHORT).show()
    }

    private fun updateProfile() {
        // Validate inputs
        if (validateInputs()) {
            // Show loading indicator if needed
            // val loadingIndicator = view?.findViewById<ProgressBar>(R.id.loading_indicator)
            // loadingIndicator?.visibility = View.VISIBLE

            // Collect form data
            val firstName = firstNameInput.text.toString().trim()
            val lastName = lastNameInput.text.toString().trim()
            val username = usernameInput.text.toString().trim()
            val email = emailInput.text.toString().trim()
            val phoneNumber = phoneNumberInput.text.toString().trim()
            val gender = genderDropdown.text.toString().trim()
            val dob = dobInput.text.toString().trim()
            val address = addressInput.text.toString().trim()

            // In a real app, you would update the user profile via API
            // For example:
            /*
            val userService = ApiClient.userService
            val request = UpdateProfileRequest(firstName, lastName, email, phoneNumber, etc)

            lifecycleScope.launch {
                try {
                    val response = userService.updateProfile(request)
                    if (response.isSuccessful) {
                        // Update successful
                        Toast.makeText(requireContext(), "Profile updated successfully", Toast.LENGTH_SHORT).show()
                        // Navigate back
                        showBottomNavigation()
                        requireActivity().onBackPressed()
                    } else {
                        // Handle error
                        Toast.makeText(requireContext(), "Failed to update profile", Toast.LENGTH_SHORT).show()
                    }
                } catch (e: Exception) {
                    // Handle network or other errors
                    Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                } finally {
                    // Hide loading indicator
                    loadingIndicator?.visibility = View.GONE
                }
            }
            */

            // For now, just show a success message and navigate back
            Toast.makeText(requireContext(), "Profile updated successfully", Toast.LENGTH_SHORT).show()

            // Show bottom navigation before going back
            showBottomNavigation()

            // Navigate back
            requireActivity().onBackPressed()
        }
    }

    private fun validateInputs(): Boolean {
        var isValid = true

        // Validate first name
        if (firstNameInput.text.toString().trim().isEmpty()) {
            view?.findViewById<TextInputLayout>(R.id.first_name_layout)?.error = "First name is required"
            isValid = false
        } else {
            view?.findViewById<TextInputLayout>(R.id.first_name_layout)?.error = null
        }

        // Validate last name
        if (lastNameInput.text.toString().trim().isEmpty()) {
            view?.findViewById<TextInputLayout>(R.id.last_name_layout)?.error = "Last name is required"
            isValid = false
        } else {
            view?.findViewById<TextInputLayout>(R.id.last_name_layout)?.error = null
        }

        // Validate username
        if (usernameInput.text.toString().trim().isEmpty()) {
            view?.findViewById<TextInputLayout>(R.id.username_layout)?.error = "Username is required"
            isValid = false
        } else {
            view?.findViewById<TextInputLayout>(R.id.username_layout)?.error = null
        }

        // Validate email
        val email = emailInput.text.toString().trim()
        if (email.isEmpty()) {
            view?.findViewById<TextInputLayout>(R.id.email_layout)?.error = "Email is required"
            isValid = false
        } else if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            view?.findViewById<TextInputLayout>(R.id.email_layout)?.error = "Enter a valid email address"
            isValid = false
        } else {
            view?.findViewById<TextInputLayout>(R.id.email_layout)?.error = null
        }

        // Validate phone number
        if (phoneNumberInput.text.toString().trim().isEmpty()) {
            view?.findViewById<TextInputLayout>(R.id.phone_number_layout)?.error = "Phone number is required"
            isValid = false
        } else {
            view?.findViewById<TextInputLayout>(R.id.phone_number_layout)?.error = null
        }

        // Validate gender
        if (genderDropdown.text.toString().trim().isEmpty()) {
            view?.findViewById<TextInputLayout>(R.id.gender_layout)?.error = "Gender is required"
            isValid = false
        } else {
            view?.findViewById<TextInputLayout>(R.id.gender_layout)?.error = null
        }

        // Validate date of birth
        if (dobInput.text.toString().trim().isEmpty()) {
            view?.findViewById<TextInputLayout>(R.id.dob_layout)?.error = "Date of birth is required"
            isValid = false
        } else {
            view?.findViewById<TextInputLayout>(R.id.dob_layout)?.error = null
        }

        // Validate address
        if (addressInput.text.toString().trim().isEmpty()) {
            view?.findViewById<TextInputLayout>(R.id.address_layout)?.error = "Address is required"
            isValid = false
        } else {
            view?.findViewById<TextInputLayout>(R.id.address_layout)?.error = null
        }

        return isValid
    }
}