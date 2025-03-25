package com.example.barangay360_mobile

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import android.widget.Button
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.google.android.material.textfield.TextInputLayout

class RequestServicesFragment : Fragment() {

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.fragment_request_services, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Setup service type dropdowns
        setupDropdowns(view)

        // Setup button clicks
        view.findViewById<Button>(R.id.btn_submit).setOnClickListener {
            if (validateInputs(view)) {
                submitServiceRequest()
            }
        }

        view.findViewById<Button>(R.id.btn_cancel).setOnClickListener {
            clearForm(view)
        }
    }

    // Update setupDropdowns method to include all service types
    private fun setupDropdowns(view: View) {
        // Service type options
        val serviceTypes = arrayOf(
            "Barangay Certificate",
            "Barangay Clearance",
            "Barangay ID Card",
            "Business Permit",
            "Certificate of Residency",
            "Certificate of Indigency"
        )

        // Setup service type dropdown
        val dropdown = view.findViewById<AutoCompleteTextView>(R.id.service_type_dropdown)
        val adapter = ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, serviceTypes)
        dropdown.setAdapter(adapter)
    }

    // Update validateInputs method to validate all required fields
    private fun validateInputs(view: View): Boolean {
        var isValid = true

        // Validate service type
        val serviceTypeLayout = view.findViewById<TextInputLayout>(R.id.service_type_layout)
        val serviceType = serviceTypeLayout.editText?.text.toString().trim()
        if (serviceType.isEmpty()) {
            serviceTypeLayout.error = "Service type is required"
            isValid = false
        } else {
            serviceTypeLayout.error = null
        }

        // Validate purpose
        val purposeLayout = view.findViewById<TextInputLayout>(R.id.purpose_layout)
        val purpose = purposeLayout.editText?.text.toString().trim()
        if (purpose.isEmpty()) {
            purposeLayout.error = "Purpose is required"
            isValid = false
        } else {
            purposeLayout.error = null
        }

        // Validate contact number
        val contactLayout = view.findViewById<TextInputLayout>(R.id.contact_number_layout)
        val contact = contactLayout.editText?.text.toString().trim()
        if (contact.isEmpty()) {
            contactLayout.error = "Contact number is required"
            isValid = false
        } else {
            contactLayout.error = null
        }

        // Validate address
        val addressLayout = view.findViewById<TextInputLayout>(R.id.address_layout)
        val address = addressLayout.editText?.text.toString().trim()
        if (address.isEmpty()) {
            addressLayout.error = "Address is required"
            isValid = false
        } else {
            addressLayout.error = null
        }

        return isValid
    }

    // Update clearForm method to clear all fields
    private fun clearForm(view: View) {
        // Clear all input fields
        view.findViewById<AutoCompleteTextView>(R.id.service_type_dropdown).setText("")
        view.findViewById<TextInputLayout>(R.id.purpose_layout).editText?.setText("")
        view.findViewById<TextInputLayout>(R.id.additional_details_layout).editText?.setText("")
        view.findViewById<TextInputLayout>(R.id.contact_number_layout).editText?.setText("")
        view.findViewById<TextInputLayout>(R.id.address_layout).editText?.setText("")

        // Clear all errors
        view.findViewById<TextInputLayout>(R.id.service_type_layout).error = null
        view.findViewById<TextInputLayout>(R.id.purpose_layout).error = null
        view.findViewById<TextInputLayout>(R.id.additional_details_layout).error = null
        view.findViewById<TextInputLayout>(R.id.contact_number_layout).error = null
        view.findViewById<TextInputLayout>(R.id.address_layout).error = null
    }

    private fun submitServiceRequest() {
        // Here you would typically call an API to submit the request
        Toast.makeText(requireContext(), "Service request submitted successfully", Toast.LENGTH_SHORT).show()
        clearForm(requireView())

        // Navigate to My Services tab to see the newly created request
        (parentFragment as? ServicesFragment)?.let {
            it.viewPager.currentItem = 1
        }
    }
}