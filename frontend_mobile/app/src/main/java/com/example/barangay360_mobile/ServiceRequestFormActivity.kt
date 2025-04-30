package com.example.barangay360_mobile

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.example.barangay360_mobile.api.models.ServiceRequestRequest
import com.example.barangay360_mobile.databinding.ActivityServiceRequestFormBinding
import com.example.barangay360_mobile.viewmodel.ServiceRequestViewModel
import com.google.gson.Gson
import org.json.JSONObject

class ServiceRequestFormActivity : AppCompatActivity() {
    private lateinit var binding: ActivityServiceRequestFormBinding
    private lateinit var viewModel: ServiceRequestViewModel
    private var serviceType: String? = null
    private var userId: Long? = null
    private var mode: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityServiceRequestFormBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        viewModel = ViewModelProvider(this)[ServiceRequestViewModel::class.java]
        
        // Get data from intent
        serviceType = intent.getStringExtra("service_type")
        userId = intent.getLongExtra("user_id", -1)
        mode = intent.getStringExtra("mode")
        
        // Validate required data
        if (serviceType == null || userId == -1L) {
            Toast.makeText(this, "Missing required data", Toast.LENGTH_SHORT).show()
            finish()
            return
        }
        
        setupViews()
        setupObservers()
        
        if (mode == "auto") {
            // For auto mode, submit request immediately
            submitAutoRequest()
        }
    }
    
    private fun setupViews() {
        binding.toolbarTitle.text = "Service Request Form"
        binding.serviceTypeText.text = "Service Type: $serviceType"
        
        binding.backButton.setOnClickListener {
            finish()
        }
        
        binding.submitButton.setOnClickListener {
            submitFormRequest()
        }
        
        // Show/hide form fields based on service type
        when (serviceType?.toLowerCase()) {
            "barangay_certificate" -> {
                binding.purposeLayout.visibility = View.VISIBLE
                binding.contactNumberLayout.visibility = View.VISIBLE
                binding.addressLayout.visibility = View.VISIBLE
            }
            "certificate_of_residency" -> {
                binding.purposeLayout.visibility = View.VISIBLE
                binding.contactNumberLayout.visibility = View.VISIBLE
                binding.addressLayout.visibility = View.VISIBLE
            }
            // Add more service types here
            else -> {
                // Default case - show all fields
                binding.purposeLayout.visibility = View.VISIBLE
                binding.contactNumberLayout.visibility = View.VISIBLE
                binding.addressLayout.visibility = View.VISIBLE
            }
        }
        
        if (mode == "auto") {
            binding.formLayout.visibility = View.GONE
            binding.loadingLayout.visibility = View.VISIBLE
            binding.submitButton.visibility = View.GONE
        } else {
            binding.formLayout.visibility = View.VISIBLE
            binding.loadingLayout.visibility = View.GONE
            binding.submitButton.visibility = View.VISIBLE
        }
    }
    
    private fun setupObservers() {
        viewModel.serviceRequestResult.observe(this) { response ->
            binding.loadingLayout.visibility = View.GONE
            if (response != null) {
                Toast.makeText(this, "Request submitted successfully", Toast.LENGTH_SHORT).show()
                setResult(RESULT_OK)
                finish()
            }
        }
        
        viewModel.error.observe(this) { error ->
            binding.loadingLayout.visibility = View.GONE
            if (error != null) {
                Toast.makeText(this, error, Toast.LENGTH_LONG).show()
                if (mode == "auto") {
                    setResult(RESULT_CANCELED)
                    finish()
                }
            }
        }
    }
    
    private fun submitAutoRequest() {
        if (userId != null && serviceType != null) {
            val request = ServiceRequestRequest(
                userId = userId!!,
                serviceType = serviceType!!,
                details = "Auto-generated request",
                purpose = when (serviceType?.toLowerCase()) {
                    "barangay_certificate" -> "General Purpose"
                    "certificate_of_residency" -> "Proof of Residency"
                    else -> "General Purpose"
                },
                contactNumber = null,
                address = null,
                mode = "auto"
            )
            binding.loadingLayout.visibility = View.VISIBLE
            viewModel.submitServiceRequest(request)
        } else {
            Toast.makeText(this, "Missing required data", Toast.LENGTH_SHORT).show()
            finish()
        }
    }
    
    private fun submitFormRequest() {
        if (userId != null && serviceType != null) {
            val purpose = binding.purposeInput.text.toString()
            val contactNumber = binding.contactNumberInput.text.toString()
            val address = binding.addressInput.text.toString()
            
            if (purpose.isBlank()) {
                binding.purposeInput.error = "Purpose is required"
                return
            }
            
            val request = ServiceRequestRequest(
                userId = userId!!,
                serviceType = serviceType!!,
                details = "Form submission",
                purpose = purpose,
                contactNumber = contactNumber.takeIf { it.isNotBlank() },
                address = address.takeIf { it.isNotBlank() },
                mode = "form"
            )
            
            binding.loadingLayout.visibility = View.VISIBLE
            binding.submitButton.isEnabled = false
            viewModel.submitServiceRequest(request)
        } else {
            Toast.makeText(this, "Missing required data", Toast.LENGTH_SHORT).show()
            finish()
        }
    }
} 