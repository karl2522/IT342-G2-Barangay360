package com.example.barangay360_mobile

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import android.widget.Button
import android.widget.ProgressBar
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.example.barangay360_mobile.api.ApiClient
import com.example.barangay360_mobile.api.models.ServiceRequestRequest
import com.example.barangay360_mobile.util.SessionManager
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import kotlinx.coroutines.launch

class RequestServicesFragment : Fragment() {

    private lateinit var serviceTypeDropdown: AutoCompleteTextView
    private lateinit var purposeEditText: TextInputEditText
    private lateinit var additionalDetailsEditText: TextInputEditText
    private lateinit var contactNumberEditText: TextInputEditText
    private lateinit var addressEditText: TextInputEditText
    private lateinit var submitButton: Button
    private lateinit var cancelButton: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var sessionManager: SessionManager

    private var qrServiceType: String? = null
    private var qrPurpose: String? = null
    private var qrMode: String? = null
    private var qrUserId: Long? = null

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_request_services, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Initialize SessionManager using getInstance()
        sessionManager = SessionManager.getInstance()

        // Initialize form fields
        serviceTypeDropdown = view.findViewById(R.id.service_type_dropdown)
        purposeEditText = view.findViewById(R.id.purpose_input)
        additionalDetailsEditText = view.findViewById(R.id.additional_details_input)
        contactNumberEditText = view.findViewById(R.id.contact_number_input)
        addressEditText = view.findViewById(R.id.address_input)
        submitButton = view.findViewById(R.id.btn_submit)
        cancelButton = view.findViewById(R.id.btn_cancel)
        progressBar = view.findViewById(R.id.request_service_progress_bar)

        setupDropdowns(view)

        // Get QR code data from arguments
        arguments?.let { args ->
            qrServiceType = args.getString("service_type")
            qrPurpose = args.getString("purpose")
            qrMode = args.getString("mode")
            qrUserId = args.getLong("user_id", -1).takeIf { it != -1L }

            // If we have QR data and mode is auto, submit automatically
            if (qrServiceType != null && qrMode == "auto" && qrUserId != null) {
                submitAutoRequest()
            } else {
                // Otherwise pre-fill the form
                prefillServiceForm(qrServiceType ?: "", qrPurpose ?: "")
            }
        }

        submitButton.setOnClickListener {
            if (validateInputs(view)) {
                submitServiceRequest()
            }
        }

        cancelButton.setOnClickListener {
            clearForm(view)
        }
    }

    private fun submitAutoRequest() {
        // Get userId either from QR or from session
        if (qrUserId != null) {
            // We already have a Long type userId from QR code
            processAutoRequest(qrUserId!!)
        } else {
            // Get userId from session manager (String type)
            val userIdStr = sessionManager.getUserId()
            if (userIdStr == null) {
                Toast.makeText(context, "User ID not found. Please log in again.", Toast.LENGTH_SHORT).show()
                return
            }
            
            // Convert string userId to Long
            val userIdLong = userIdStr.toLongOrNull()
            if (userIdLong == null) {
                Toast.makeText(context, "Invalid user ID format", Toast.LENGTH_SHORT).show()
                return
            }
            
            processAutoRequest(userIdLong)
        }
    }
    
    private fun processAutoRequest(userId: Long) {
        // Get user's contact and address from session manager
        val userPhone = sessionManager.getPhone()
        val userAddress = sessionManager.getAddress()
        
        val request = ServiceRequestRequest(
            userId = userId,
            serviceType = qrServiceType!!,
            details = "Auto-generated request",
            purpose = qrPurpose ?: when (qrServiceType?.toLowerCase()) {
                "barangay_certificate" -> "General Purpose"
                "certificate_of_residency" -> "Proof of Residency"
                else -> "General Purpose"
            },
            contactNumber = userPhone ?: "Not provided",
            address = userAddress ?: "Not provided"
        )

        submitRequest(request)
    }

    private fun submitServiceRequest() {
        // Get userId either from QR or from session
        if (qrUserId != null) {
            // We already have a Long type userId from QR code
            processServiceRequest(qrUserId!!)
        } else {
            // Get userId from session manager (String type)
            val userIdStr = sessionManager.getUserId()
            if (userIdStr == null) {
                Toast.makeText(context, "User ID not found. Please log in again.", Toast.LENGTH_SHORT).show()
                return
            }
            
            // Convert string userId to Long
            val userIdLong = userIdStr.toLongOrNull()
            if (userIdLong == null) {
                Toast.makeText(context, "Invalid user ID format", Toast.LENGTH_SHORT).show()
                return
            }
            
            processServiceRequest(userIdLong)
        }
    }
    
    private fun processServiceRequest(userId: Long) {
        val serviceType = serviceTypeDropdown.text.toString().trim()
        val purpose = purposeEditText.text.toString().trim()
        val details = additionalDetailsEditText.text.toString().trim()
        val contactNumber = contactNumberEditText.text.toString().trim()
        val address = addressEditText.text.toString().trim()

        val request = ServiceRequestRequest(
            userId = userId,
            serviceType = serviceType,
            details = details.takeIf { it.isNotEmpty() } ?: "Form submission",
            purpose = purpose,
            contactNumber = contactNumber.takeIf { it.isNotEmpty() },
            address = address.takeIf { it.isNotEmpty() },
            mode = "form"
        )

        submitRequest(request)
    }

    private fun submitRequest(request: ServiceRequestRequest) {
        progressBar.visibility = View.VISIBLE
        submitButton.isEnabled = false

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val response = ApiClient.serviceRequestService.createServiceRequest(request)
                
                if (!isAdded) return@launch

                if (response.isSuccessful && response.body() != null) {
                    Toast.makeText(context, "Service request submitted successfully", Toast.LENGTH_SHORT).show()
                    clearForm(requireView())
                    // Navigate to My Services fragment
                    requireActivity().supportFragmentManager.beginTransaction()
                        .replace(R.id.fragment_container, MyServicesFragment())
                        .commit()
                } else {
                    Toast.makeText(context, "Failed to submit request: ${response.message()}", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                if (isAdded) {
                    Log.e("RequestServices", "Error: ${e.message}", e)
                    Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_LONG).show()
                }
            } finally {
                if (isAdded) {
                    progressBar.visibility = View.GONE
                    submitButton.isEnabled = true
                }
            }
        }
    }

    fun prefillServiceForm(serviceType: String, purpose: String) {
        if (isAdded && ::serviceTypeDropdown.isInitialized) {
            val serviceTypes = resources.getStringArray(R.array.service_types)
            if (serviceType.isNotEmpty() && serviceTypes.contains(serviceType)) {
                serviceTypeDropdown.setText(serviceType, false)
            } else if (serviceType.isNotEmpty()) {
                Log.w("RequestServicesFragment", "Service type '$serviceType' from QR not in dropdown list.")
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
        if (contact.isNotEmpty() && !android.util.Patterns.PHONE.matcher(contact).matches()) {
            contactLayout.error = "Invalid phone number format"
            isValid = false
        }

        return isValid
    }

    private fun clearForm(view: View) {
        serviceTypeDropdown.setText("", false)
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
}