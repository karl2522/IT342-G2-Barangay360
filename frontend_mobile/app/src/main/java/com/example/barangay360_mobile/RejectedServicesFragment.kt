package com.example.barangay360_mobile

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import android.widget.Button
import android.widget.ProgressBar // Import ProgressBar
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope // Import lifecycleScope
import com.example.barangay360_mobile.api.ApiClient // Import ApiClient
import com.example.barangay360_mobile.api.models.ServiceRequestRequest // Import request model
import com.example.barangay360_mobile.util.SessionManager // Import SessionManager
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import kotlinx.coroutines.launch // Import launch

class RequestServicesFragment : Fragment() {

    private lateinit var serviceTypeDropdown: AutoCompleteTextView
    private lateinit var purposeEditText: TextInputEditText
    private lateinit var additionalDetailsEditText: TextInputEditText
    private lateinit var contactNumberEditText: TextInputEditText
    private lateinit var addressEditText: TextInputEditText
    private lateinit var submitButton: Button // Add reference for buttons
    private lateinit var cancelButton: Button // Add reference for buttons
    private lateinit var progressBar: ProgressBar // Add reference for progress bar

    // Add SessionManager instance
    private lateinit var sessionManager: SessionManager

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_request_services, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Initialize SessionManager
        sessionManager = SessionManager(requireContext())

        // Initialize form fields
        serviceTypeDropdown = view.findViewById(R.id.service_type_dropdown)
        purposeEditText = view.findViewById(R.id.purpose_input)
        additionalDetailsEditText = view.findViewById(R.id.additional_details_input)
        contactNumberEditText = view.findViewById(R.id.contact_number_input)
        addressEditText = view.findViewById(R.id.address_input)
        submitButton = view.findViewById(R.id.btn_submit) // Initialize button
        cancelButton = view.findViewById(R.id.btn_cancel) // Initialize button
        progressBar = view.findViewById(R.id.request_service_progress_bar) // Initialize progress bar

        setupDropdowns(view)

        submitButton.setOnClickListener {
            if (validateInputs(view)) {
                submitServiceRequest()
            }
        }

        cancelButton.setOnClickListener {
            clearForm(view)
        }

        // Pre-fill form if data comes from arguments (e.g., QR code scan)
        arguments?.let {
            val serviceType = it.getString("service_type", "")
            val purpose = it.getString("purpose", "")
            if (serviceType.isNotEmpty() || purpose.isNotEmpty()) {
                prefillServiceForm(serviceType, purpose)
            }
        }
    }

    fun prefillServiceForm(serviceType: String, purpose: String) {
        if (isAdded && ::serviceTypeDropdown.isInitialized) {
            val serviceTypes = resources.getStringArray(R.array.service_types)
            if (serviceType.isNotEmpty() && serviceTypes.contains(serviceType)) {
                serviceTypeDropdown.setText(serviceType, false) // Set text without filtering
            } else if (serviceType.isNotEmpty()) {
                Log.w("RequestServicesFragment", "Service type '$serviceType' from QR not in dropdown list.")
                // Optionally show a message to the user
            }

            if (purpose.isNotEmpty() && ::purposeEditText.isInitialized) {
                purposeEditText.setText(purpose)
            }
        }
    }

    private fun setupDropdowns(view: View) {
        val serviceTypes = requireContext().resources.getStringArray(R.array.service_types)
        val adapter = ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, serviceTypes)
        serviceTypeDropdown.setAdapter(adapter)
    }

    private fun validateInputs(view: View): Boolean {
        var isValid = true
        val serviceTypeLayout = view.findViewById<TextInputLayout>(R.id.service_type_layout)
        val purposeLayout = view.findViewById<TextInputLayout>(R.id.purpose_layout)
        val contactLayout = view.findViewById<TextInputLayout>(R.id.contact_number_layout)
        val addressLayout = view.findViewById<TextInputLayout>(R.id.address_layout)

        // Clear previous errors
        serviceTypeLayout.error = null
        purposeLayout.error = null
        contactLayout.error = null
        addressLayout.error = null

        // Validate service type
        val serviceType = serviceTypeLayout.editText?.text.toString().trim()
        if (serviceType.isEmpty()) {
            serviceTypeLayout.error = "Service type is required"
            isValid = false
        }

        // Validate purpose
        val purpose = purposeLayout.editText?.text.toString().trim()
        if (purpose.isEmpty()) {
            purposeLayout.error = "Purpose is required"
            isValid = false
        }

        // Validate contact number
        val contact = contactLayout.editText?.text.toString().trim()
        if (contact.isEmpty()) {
            contactLayout.error = "Contact number is required"
            isValid = false
        } else if (!android.util.Patterns.PHONE.matcher(contact).matches()) { // Basic phone validation
            contactLayout.error = "Invalid phone number format"
            isValid = false
        }


        // Validate address
        val address = addressLayout.editText?.text.toString().trim()
        if (address.isEmpty()) {
            addressLayout.error = "Address is required"
            isValid = false
        }

        return isValid
    }

    private fun clearForm(view: View) {
        serviceTypeDropdown.setText("", false) // Clear dropdown
        purposeEditText.setText("")
        additionalDetailsEditText.setText("")
        contactNumberEditText.setText("")
        addressEditText.setText("")

        // Clear errors
        view.findViewById<TextInputLayout>(R.id.service_type_layout).error = null
        view.findViewById<TextInputLayout>(R.id.purpose_layout).error = null
        view.findViewById<TextInputLayout>(R.id.additional_details_layout).error = null
        view.findViewById<TextInputLayout>(R.id.contact_number_layout).error = null
        view.findViewById<TextInputLayout>(R.id.address_layout).error = null
    }

    private fun submitServiceRequest() {
        // Show loading and disable buttons
        setLoadingState(true)

        // Get user ID and token
        val userId = sessionManager.getUserId()
        val token = sessionManager.getAuthToken()

        if (userId == null || token == null) {
            if (isAdded) Toast.makeText(requireContext(), "User session error. Please login again.", Toast.LENGTH_LONG).show()
            setLoadingState(false)
            return
        }

        // Collect data from form
        val serviceType = serviceTypeDropdown.text.toString()
        val purpose = purposeEditText.text.toString().trim()
        val details = additionalDetailsEditText.text.toString().trim()
        val contactNumber = contactNumberEditText.text.toString().trim()
        val address = addressEditText.text.toString().trim()

        // Create request object
        val request = ServiceRequestRequest(
            userId = userId,
            serviceType = serviceType,
            details = details.ifEmpty { null }, // Send null if empty, adjust if backend requires empty string
            purpose = purpose, // Assuming purpose is required based on validation
            contactNumber = contactNumber, // Assuming contact is required
            address = address // Assuming address is required
        )

        // Launch coroutine for API call
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val response = ApiClient.serviceRequestService.createServiceRequest("Bearer $token", request)

                if (!isAdded) return@launch // Check if fragment is still added

                if (response.isSuccessful) {
                    Toast.makeText(requireContext(), "Service request submitted successfully", Toast.LENGTH_SHORT).show()
                    clearForm(requireView())

                    // Navigate back or to My Services (pop back stack is usually enough)
                    requireActivity().supportFragmentManager.popBackStack()
                    // If you specifically want to show MyServicesFragment after submission:
                    // requireActivity().supportFragmentManager.beginTransaction()
                    //    .replace(R.id.fragment_container, MyServicesFragment()) // Assuming MyServicesFragment handles its own data loading
                    //    .commit()


                } else {
                    // Handle specific errors from backend if possible
                    val errorBody = response.errorBody()?.string() ?: "Unknown error"
                    Log.e("RequestService", "API Error: ${response.code()} - $errorBody")
                    Toast.makeText(requireContext(), "Submission failed: ${response.code()}", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                if (isAdded) {
                    Log.e("RequestService", "Exception: ${e.message}", e)
                    if (e !is kotlinx.coroutines.CancellationException) {
                        Toast.makeText(requireContext(), "Error: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
                    }
                }
            } finally {
                // Hide loading and enable buttons only if fragment is still added
                if (isAdded) {
                    setLoadingState(false)
                }
            }
        }
    }

    // Helper function to manage loading state
    private fun setLoadingState(isLoading: Boolean) {
        if (::progressBar.isInitialized) { // Check if initialized
            progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        }
        if (::submitButton.isInitialized && ::cancelButton.isInitialized) { // Check if initialized
            submitButton.isEnabled = !isLoading
            cancelButton.isEnabled = !isLoading
            // Optionally change button appearance during loading
        }
    }
}