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

    private fun setupDropdowns(view: View) {
        // Sample data for dropdowns
        val serviceTypes = arrayOf(
            "Barangay Clearance",
            "Business Permit",
            "Certificate of Indigency",
            "Certificate of Residency",
            "Burial Assistance"
        )

        // Setup first dropdown
        val dropdown1 = view.findViewById<AutoCompleteTextView>(R.id.service_type_dropdown)
        val adapter1 = ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, serviceTypes)
        dropdown1.setAdapter(adapter1)

        // Setup second dropdown
        val dropdown2 = view.findViewById<AutoCompleteTextView>(R.id.service_type_dropdown2)
        val adapter2 = ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, serviceTypes)
        dropdown2.setAdapter(adapter2)
    }

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

        // Validate description
        val descriptionLayout = view.findViewById<TextInputLayout>(R.id.description_layout)
        val description = descriptionLayout.editText?.text.toString().trim()
        if (description.isEmpty()) {
            descriptionLayout.error = "Description is required"
            isValid = false
        } else {
            descriptionLayout.error = null
        }

        // Validate location
        val locationLayout = view.findViewById<TextInputLayout>(R.id.location_layout)
        val location = locationLayout.editText?.text.toString().trim()
        if (location.isEmpty()) {
            locationLayout.error = "Location is required"
            isValid = false
        } else {
            locationLayout.error = null
        }

        return isValid
    }

    private fun clearForm(view: View) {
        // Clear all input fields
        view.findViewById<TextInputLayout>(R.id.service_type_layout).editText?.setText("")
        view.findViewById<TextInputLayout>(R.id.description_layout).editText?.setText("")
        view.findViewById<TextInputLayout>(R.id.location_layout).editText?.setText("")
        view.findViewById<AutoCompleteTextView>(R.id.service_type_dropdown).setText("")
        view.findViewById<AutoCompleteTextView>(R.id.service_type_dropdown2).setText("")

        // Clear all errors
        view.findViewById<TextInputLayout>(R.id.service_type_layout).error = null
        view.findViewById<TextInputLayout>(R.id.description_layout).error = null
        view.findViewById<TextInputLayout>(R.id.location_layout).error = null
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