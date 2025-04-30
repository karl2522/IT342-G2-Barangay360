package com.example.barangay360_mobile

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.util.DisplayMetrics
import android.util.Size
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.cardview.widget.CardView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.google.common.util.concurrent.ListenableFuture
import com.example.barangay360_mobile.databinding.ActivityQrCodeScannerBinding
import com.example.barangay360_mobile.service.QRLoginService
import com.example.barangay360_mobile.util.ApiService
import com.example.barangay360_mobile.util.SessionManager
import com.example.barangay360_mobile.api.ApiClient
import com.example.barangay360_mobile.api.models.ServiceRequestRequest
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.Locale

class QRCodeScannerActivity : AppCompatActivity() {

    private lateinit var binding: ActivityQrCodeScannerBinding
    private lateinit var cameraProviderFuture: ListenableFuture<ProcessCameraProvider>
    private lateinit var cameraExecutor: ExecutorService
    private lateinit var sessionManager: SessionManager
    private lateinit var qrLoginService: QRLoginService

    private lateinit var previewView: PreviewView
    private lateinit var scannerOverlay: View
    private lateinit var scanInstructionsText: TextView
    private lateinit var resultCard: CardView
    private lateinit var qrContentText: TextView
    private lateinit var closeButton: Button
    private lateinit var visitWebsiteButton: Button
    private lateinit var proceedButton: Button

    private var camera: Camera? = null
    private var cameraProvider: ProcessCameraProvider? = null
    private var preview: Preview? = null
    private var imageAnalysis: ImageAnalysis? = null
    private var imageCapture: ImageCapture? = null

    private var isScanning = true
    private var detectedUrl = ""
    private var isLoginQrCode = false
    private var isServiceRequestQrCode = false
    private var loginSessionId: String? = null
    private var serviceType: String? = null
    private var purpose: String? = null

    companion object {
        private const val REQUEST_CODE_PERMISSIONS = 10
        private val REQUIRED_PERMISSIONS = arrayOf(Manifest.permission.CAMERA)
        const val QR_TYPE_LOGIN = "login"
        const val QR_TYPE_SERVICE_REQUEST = "service_request"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityQrCodeScannerBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Get the already initialized SessionManager instance
        sessionManager = SessionManager.getInstance()
        qrLoginService = ApiService.buildService(QRLoginService::class.java)

        // Initialize views
        previewView = binding.previewView
        scannerOverlay = binding.scannerOverlay
        scanInstructionsText = binding.scanInstructionsText
        resultCard = binding.resultCard
        qrContentText = binding.qrContentText
        closeButton = binding.closeButton
        visitWebsiteButton = binding.visitWebsiteButton
        proceedButton = binding.proceedButton

        previewView.implementationMode = PreviewView.ImplementationMode.PERFORMANCE

        closeButton.setOnClickListener {
            resultCard.visibility = View.GONE
            isScanning = true
            cameraProvider?.let {
                bindCameraUseCases()
            }
        }

        proceedButton.setOnClickListener {
            if (isLoginQrCode && loginSessionId != null) {
                confirmQRLogin(loginSessionId!!)
            } else if (isServiceRequestQrCode && serviceType != null) {
                createServiceRequest()
            }
        }

        // Create camera executor
        cameraExecutor = Executors.newSingleThreadExecutor()

        // Check camera permission and start camera if granted
        if (allPermissionsGranted()) {
            startCamera()
        } else {
            ActivityCompat.requestPermissions(
                this, REQUIRED_PERMISSIONS, REQUEST_CODE_PERMISSIONS
            )
        }
    }

    private fun confirmQRLogin(sessionId: String) {
        lifecycleScope.launch {
            try {
                // Get the current auth token
                val token = sessionManager.fetchAuthToken()
                if (token == null) {
                    Toast.makeText(this@QRCodeScannerActivity, "Please login first", Toast.LENGTH_SHORT).show()
                    finish()
                    return@launch
                }

                val response = qrLoginService.confirmQRLogin("Bearer $token", sessionId)
                if (response.isSuccessful && response.body() != null) {
                    val loginResponse = response.body()!!
                    
                    // Save new tokens with their expiration timestamps
                    sessionManager.saveAuthToken(
                        loginResponse.accessToken.token,
                        loginResponse.accessToken.getExpirationTimestamp()
                    )
                    sessionManager.saveRefreshToken(
                        loginResponse.refreshToken.token,
                        loginResponse.refreshToken.getExpirationTimestamp()
                    )
                    
                    // Save user details
                    sessionManager.saveUserDetails(
                        loginResponse.id.toString(),
                        loginResponse.firstName,
                        loginResponse.lastName,
                        loginResponse.email,
                        loginResponse.roles,
                        loginResponse.address,
                        loginResponse.phone,
                        loginResponse.active,
                        loginResponse.warnings
                    )
                    
                    Toast.makeText(this@QRCodeScannerActivity, "Login confirmed successfully", Toast.LENGTH_SHORT).show()
                    finish()
                } else {
                    Toast.makeText(this@QRCodeScannerActivity, "Failed to confirm login: ${response.message()}", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@QRCodeScannerActivity, "Error confirming login: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun createServiceRequest() {
        // Get userId from session manager
        val userIdStr = sessionManager.getUserId()
        if (userIdStr == null) {
            Toast.makeText(this, "User ID not found. Please log in first.", Toast.LENGTH_SHORT).show()
            finish()
            return
        }
        
        // Convert string userId to Long
        val userIdLong = userIdStr.toLongOrNull()
        if (userIdLong == null) {
            Toast.makeText(this, "Invalid user ID format", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        // Get user's contact number and address from session
        val userPhone = sessionManager.getPhone()
        val userAddress = sessionManager.getAddress()

        lifecycleScope.launch {
            try {
                // Creating the request with required fields
                val request = ServiceRequestRequest(
                    userId = userIdLong,
                    serviceType = serviceType!!,
                    details = "Auto-generated request via QR code",
                    purpose = purpose ?: when (serviceType?.toLowerCase()) {
                        "barangay_certificate" -> "General Purpose"
                        "certificate_of_residency" -> "Proof of Residency"
                        else -> "General Purpose"
                    },
                    contactNumber = userPhone ?: "Not provided", // Use user's phone or default text
                    address = userAddress ?: "Not provided", // Use user's address or default text
                    // Not using mode anymore as per requirements
                    mode = null
                )

                // Submit the request
                val response = ApiClient.serviceRequestService.createServiceRequest(request)
                
                if (response.isSuccessful && response.body() != null) {
                    Toast.makeText(this@QRCodeScannerActivity, "Service request created successfully", Toast.LENGTH_SHORT).show()
                    
                    // Navigate to MyServicesFragment
                    val intent = Intent(this@QRCodeScannerActivity, HomeActivity::class.java)
                    intent.putExtra("openMyServices", true)
                    startActivity(intent)
                    finish()
                } else {
                    Toast.makeText(this@QRCodeScannerActivity, "Failed to create service request: ${response.message()}", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@QRCodeScannerActivity, "Error creating service request: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)

        cameraProviderFuture.addListener({
            val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()

            val preview = Preview.Builder()
                .build()
                .also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

            imageCapture = ImageCapture.Builder().build()

            val imageAnalyzer = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also {
                    it.setAnalyzer(cameraExecutor, QRCodeAnalyzer { qrContent ->
                        handleQRCodeResult(qrContent)
                    })
                }

            try {
                cameraProvider.unbindAll()
                camera = cameraProvider.bindToLifecycle(
                    this, CameraSelector.DEFAULT_BACK_CAMERA,
                    preview, imageCapture, imageAnalyzer
                )
            } catch (exc: Exception) {
                Toast.makeText(this, "Failed to start camera", Toast.LENGTH_SHORT).show()
            }

        }, ContextCompat.getMainExecutor(this))
    }

    private fun handleQRCodeResult(qrContent: String) {
        if (!isScanning) return

        runOnUiThread {
            // Add debug log to see the actual content of scanned QR code
            println("QR Code scanned content: $qrContent")
            
            // First try to extract service_type from the QR code content directly
            val serviceTypePattern = "(service_type|serviceType)[=:][\"']?([a-zA-Z_]+)[\"']?".toRegex()
            val serviceTypeMatch = serviceTypePattern.find(qrContent)
            
            if (serviceTypeMatch != null) {
                // Found a service_type in the raw text, extract it directly
                isScanning = false
                isLoginQrCode = false
                isServiceRequestQrCode = true
                
                // Extract the service type from the regex match
                serviceType = serviceTypeMatch.groupValues[2]
                purpose = "Generated from QR code"
                
                // Show the extracted service type
                qrContentText.text = "Service Request QR Code detected\nService Type: $serviceType\nCreating request..."
                resultCard.visibility = View.VISIBLE
                visitWebsiteButton.visibility = View.GONE
                proceedButton.visibility = View.GONE
                
                // Create the service request automatically
                if (sessionManager.fetchAuthToken() != null) {
                    createServiceRequest()
                } else {
                    qrContentText.text = "Service Request QR Code detected\nPlease log in to proceed"
                }
                return@runOnUiThread
            }
            
            // If no direct match for service_type, try to parse as JSON
            try {
                val jsonObject = JSONObject(qrContent)
                
                when {
                    // Check if it's a login QR code
                    jsonObject.has("sessionId") && jsonObject.has("type") && jsonObject.getString("type") == "login" -> {
                        isScanning = false
                        isLoginQrCode = true
                        isServiceRequestQrCode = false
                        loginSessionId = jsonObject.getString("sessionId")
                        
                        // Update UI for login
                        qrContentText.text = "Login QR Code detected\nClick proceed to login"
                        resultCard.visibility = View.VISIBLE
                        visitWebsiteButton.visibility = View.GONE
                        proceedButton.visibility = View.VISIBLE
                        proceedButton.text = "Login"
                    }
                    
                    // Check if it's a service request QR code - more flexible detection
                    jsonObject.has("type") && jsonObject.getString("type") == "service_request" -> {
                        isScanning = false
                        isLoginQrCode = false
                        isServiceRequestQrCode = true
                        
                        // Extract service request info with better error handling
                        serviceType = if (jsonObject.has("service_type")) {
                            jsonObject.getString("service_type")
                        } else if (jsonObject.has("serviceType")) {
                            jsonObject.getString("serviceType")
                        } else {
                            // Try to find any field that might contain a service type
                            var foundType: String? = null
                            val keys = jsonObject.keys()
                            while (keys.hasNext()) {
                                val key = keys.next()
                                val value = jsonObject.optString(key, "")
                                if (value.contains("certificate") || value.contains("clearance") || 
                                    value.contains("permit") || key.contains("service") || key.contains("type")) {
                                    foundType = value
                                    break
                                }
                            }
                            foundType ?: "certificate_of_residency" // Alternative default
                        }
                        
                        purpose = if (jsonObject.has("purpose")) {
                            jsonObject.getString("purpose")
                        } else {
                            null
                        }
                        
                        // Automatically create service request if user is logged in
                        if (sessionManager.fetchAuthToken() != null) {
                            // Update UI for service request
                            qrContentText.text = "Service Request QR Code detected\nService Type: $serviceType\nCreating request..."
                            resultCard.visibility = View.VISIBLE
                            visitWebsiteButton.visibility = View.GONE
                            proceedButton.visibility = View.GONE
                            
                            createServiceRequest()
                        } else {
                            // User not logged in
                            qrContentText.text = "Service Request QR Code detected\nPlease log in to proceed"
                            resultCard.visibility = View.VISIBLE
                            visitWebsiteButton.visibility = View.GONE
                            proceedButton.visibility = View.GONE
                        }
                    }
                    
                    // Handle direct service request QR code (simplified format)
                    jsonObject.has("service_type") || jsonObject.has("serviceType") -> {
                        isScanning = false
                        isLoginQrCode = false
                        isServiceRequestQrCode = true
                        
                        // Extract service request info
                        serviceType = if (jsonObject.has("service_type")) {
                            jsonObject.getString("service_type")
                        } else {
                            jsonObject.getString("serviceType")
                        }
                        
                        purpose = if (jsonObject.has("purpose")) jsonObject.getString("purpose") else null
                        
                        // Automatically create service request if user is logged in
                        if (sessionManager.fetchAuthToken() != null) {
                            // Update UI for service request
                            qrContentText.text = "Service Request QR Code detected\nService Type: $serviceType\nCreating request..."
                            resultCard.visibility = View.VISIBLE
                            visitWebsiteButton.visibility = View.GONE
                            proceedButton.visibility = View.GONE
                            
                            createServiceRequest()
                        } else {
                            // User not logged in
                            qrContentText.text = "Service Request QR Code detected\nPlease log in to proceed"
                            resultCard.visibility = View.VISIBLE
                            visitWebsiteButton.visibility = View.GONE
                            proceedButton.visibility = View.GONE
                        }
                    }
                    
                    else -> {
                        // Try to identify what type of service this might be based on the QR content
                        isScanning = false
                        isLoginQrCode = false
                        isServiceRequestQrCode = true
                        
                        // Extract service type based on QR content keywords
                        val qrText = qrContent.toLowerCase()
                        serviceType = when {
                            qrText.contains("residency") -> "certificate_of_residency"
                            qrText.contains("clearance") -> "barangay_clearance"
                            qrText.contains("business") || qrText.contains("permit") -> "business_permit"
                            qrText.contains("indigency") -> "indigency_certificate"
                            qrText.contains("certificate") -> "barangay_certificate"
                            else -> "certificate_of_residency" // Change default
                        }
                        
                        purpose = "Generated from QR code: ${qrContent.take(30)}${if(qrContent.length > 30) "..." else ""}"
                        
                        // Automatically create service request if user is logged in
                        if (sessionManager.fetchAuthToken() != null) {
                            // Update UI 
                            qrContentText.text = "QR Code detected\nCreating ${formatServiceType(serviceType)} request..."
                            resultCard.visibility = View.VISIBLE
                            visitWebsiteButton.visibility = View.GONE
                            proceedButton.visibility = View.GONE
                            
                            createServiceRequest()
                        } else {
                            // User not logged in
                            qrContentText.text = "QR Code detected\nPlease log in to create service request"
                            resultCard.visibility = View.VISIBLE
                            visitWebsiteButton.visibility = View.GONE
                            proceedButton.visibility = View.GONE
                        }
                    }
                }
            } catch (e: Exception) {
                // Not a JSON format - try to extract service type from text
                isScanning = false
                isLoginQrCode = false
                isServiceRequestQrCode = true
                
                // Extract service type based on QR content keywords
                val qrText = qrContent.toLowerCase()
                serviceType = when {
                    qrText.contains("residency") -> "certificate_of_residency"
                    qrText.contains("clearance") -> "barangay_clearance"
                    qrText.contains("business") || qrText.contains("permit") -> "business_permit"
                    qrText.contains("indigency") -> "indigency_certificate"
                    qrText.contains("certificate") -> "barangay_certificate"
                    else -> "certificate_of_residency" // Change default
                }
                
                purpose = "Generated from QR code: ${qrContent.take(30)}${if(qrContent.length > 30) "..." else ""}"
                
                // Check if user is logged in
                if (sessionManager.fetchAuthToken() != null) {
                    // Update UI
                    qrContentText.text = "QR Code detected\nCreating ${formatServiceType(serviceType)} request..."
                    resultCard.visibility = View.VISIBLE
                    visitWebsiteButton.visibility = View.GONE
                    proceedButton.visibility = View.GONE
                    
                    // Automatically create the service request
                    createServiceRequest()
                } else {
                    // User not logged in
                    qrContentText.text = "QR Code detected\nPlease log in to create service request"
                    resultCard.visibility = View.VISIBLE
                    visitWebsiteButton.visibility = View.GONE
                    proceedButton.visibility = View.GONE
                }
            }
        }
    }
    
    // Helper function to format service type for display
    private fun formatServiceType(serviceType: String?): String {
        if (serviceType == null) return "N/A"
        
        return when (serviceType.lowercase()) {
            "barangay_certificate" -> "Barangay Certificate"
            "certificate_of_residency" -> "Certificate of Residency"
            "barangay_clearance" -> "Barangay Clearance"
            "business_permit" -> "Business Permit"
            "indigency_certificate" -> "Indigency Certificate"
            else -> {
                // For unknown types, convert snake_case to Title Case With Spaces
                serviceType.split("_")
                    .joinToString(" ") { word ->
                        word.replaceFirstChar { 
                            if (it.isLowerCase()) it.titlecase(Locale.ROOT) else it.toString() 
                        }
                    }
            }
        }
    }

    private fun allPermissionsGranted() = REQUIRED_PERMISSIONS.all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CODE_PERMISSIONS) {
            if (allPermissionsGranted()) {
                startCamera()
            } else {
                Toast.makeText(this, "Camera permission required", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }

    override fun onPause() {
        super.onPause()
        isScanning = false
        cameraProvider?.unbindAll()
    }

    override fun onResume() {
        super.onResume()
        isScanning = true
        cameraProvider?.let {
            bindCameraUseCases()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }

    private fun bindCameraUseCases() {
        startCamera()
    }
}