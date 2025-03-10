package com.example.barangay360_mobile

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.util.DisplayMetrics
import android.util.Patterns
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
import com.google.common.util.concurrent.ListenableFuture
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class QRCodeScannerActivity : AppCompatActivity() {

    private lateinit var cameraProviderFuture: ListenableFuture<ProcessCameraProvider>
    private lateinit var cameraExecutor: ExecutorService
    private lateinit var previewView: PreviewView
    private lateinit var scannerOverlay: View
    private lateinit var scanInstructionsText: TextView
    private lateinit var resultCard: CardView
    private lateinit var qrContentText: TextView
    private lateinit var closeButton: Button
    private lateinit var visitWebsiteButton: Button

    private var camera: Camera? = null
    private var cameraProvider: ProcessCameraProvider? = null
    private var preview: Preview? = null
    private var imageAnalysis: ImageAnalysis? = null

    private val CAMERA_PERMISSION_REQUEST_CODE = 100

    // Flag to prevent duplicate scans
    private var isScanning = true
    private var detectedUrl = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_qr_code_scanner)

        // Initialize views
        previewView = findViewById(R.id.previewView)
        scannerOverlay = findViewById(R.id.scannerOverlay)
        scanInstructionsText = findViewById(R.id.scanInstructionsText)
        resultCard = findViewById(R.id.resultCard)
        qrContentText = findViewById(R.id.qrContentText)
        closeButton = findViewById(R.id.closeButton)
        visitWebsiteButton = findViewById(R.id.visitWebsiteButton)

        // Configure previewView for better performance
        previewView.implementationMode = PreviewView.ImplementationMode.PERFORMANCE

        // Start the scanner animation
        startScannerAnimation()

        // Set up close button
        closeButton.setOnClickListener {
            resultCard.visibility = View.GONE
            isScanning = true
            cameraProvider?.let {
                bindCameraUseCases()
            }
        }

        // Set up visit website button
        visitWebsiteButton.setOnClickListener {
            if (detectedUrl.isNotEmpty()) {
                showConfirmationDialog(detectedUrl)
            }
        }

        // Create camera executor
        cameraExecutor = Executors.newSingleThreadExecutor()

        // Check camera permission and start camera if granted
        if (hasCameraPermission()) {
            startCamera()
        } else {
            requestCameraPermission()
        }
    }

    private fun startScannerAnimation() {
        val animationDrawable = scannerOverlay.background as? android.graphics.drawable.AnimationDrawable
        animationDrawable?.start()
    }

    private fun hasCameraPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun requestCameraPermission() {
        ActivityCompat.requestPermissions(
            this,
            arrayOf(Manifest.permission.CAMERA),
            CAMERA_PERMISSION_REQUEST_CODE
        )
    }

    private fun isValidUrl(text: String): Boolean {
        return Patterns.WEB_URL.matcher(text).matches() ||
                text.startsWith("http://") ||
                text.startsWith("https://")
    }

    private fun showConfirmationDialog(url: String) {
        AlertDialog.Builder(this)
            .setTitle("Visit Website")
            .setMessage("Would you like to visit this site?\n\n$url")
            .setPositiveButton("Yes") { _, _ ->
                openUrlInBrowser(url)
            }
            .setNegativeButton("No", null)
            .show()
    }

    private fun openUrlInBrowser(url: String) {
        try {
            var formattedUrl = url.trim()

            // Add https:// prefix if the URL doesn't have a scheme
            if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
                formattedUrl = "https://$formattedUrl"
            }

            // Create and launch the intent
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse(formattedUrl)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            // Check if there's an app that can handle this intent
            if (intent.resolveActivity(packageManager) != null) {
                startActivity(intent)
            } else {
                Toast.makeText(this, "No application can handle this URL", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            Toast.makeText(this, "Error opening URL: ${e.message}", Toast.LENGTH_SHORT).show()
            e.printStackTrace()
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == CAMERA_PERMISSION_REQUEST_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startCamera()
            } else {
                Toast.makeText(this, "Camera permission is required", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }

    private fun startCamera() {
        cameraProviderFuture = ProcessCameraProvider.getInstance(this)

        cameraProviderFuture.addListener({
            try {
                val provider = cameraProviderFuture.get()
                cameraProvider = provider
                bindCameraUseCases()
            } catch (e: Exception) {
                Toast.makeText(this, "Failed to start camera", Toast.LENGTH_SHORT).show()
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun bindCameraUseCases() {
        val cameraProvider = cameraProvider ?: return

        try {
            // Must unbind existing use cases before rebinding
            cameraProvider.unbindAll()

            // Calculate target resolution (use lower resolution for better performance)
            val metrics = DisplayMetrics().also { previewView.display?.getRealMetrics(it) }
            val screenAspectRatio = aspectRatio(metrics.widthPixels, metrics.heightPixels)

            // Lower resolution for better performance (640x480 is good for QR scanning)
            val targetResolution = Size(640, 480)

            // Camera selector
            val cameraSelector = CameraSelector.Builder()
                .requireLensFacing(CameraSelector.LENS_FACING_BACK)
                .build()

            // Preview use case
            preview = Preview.Builder()
                .setTargetResolution(targetResolution)
                .build()
                .also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

            // Image analysis use case
            imageAnalysis = ImageAnalysis.Builder()
                .setTargetResolution(targetResolution)
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also {
                    it.setAnalyzer(cameraExecutor, QRCodeAnalyzer { qrResult ->
                        if (isScanning) {
                            isScanning = false
                            runOnUiThread {
                                // Show the result
                                qrContentText.text = qrResult
                                detectedUrl = qrResult  // Save the URL
                                resultCard.visibility = View.VISIBLE

                                // Check if the result is a URL and show the visit website button if it is
                                if (isValidUrl(qrResult)) {
                                    visitWebsiteButton.visibility = View.VISIBLE
                                    // Don't automatically show dialog - let user click the button
                                } else {
                                    visitWebsiteButton.visibility = View.GONE
                                }
                            }
                        }
                    })
                }

            // Bind use cases to camera
            camera = cameraProvider.bindToLifecycle(
                this,
                cameraSelector,
                preview,
                imageAnalysis
            )

        } catch (e: Exception) {
            Toast.makeText(this, "Use case binding failed", Toast.LENGTH_SHORT).show()
        }
    }

    /**
     * Calculate the aspect ratio for the screen
     */
    private fun aspectRatio(width: Int, height: Int): Int {
        val previewRatio = maxOf(width, height).toDouble() / minOf(width, height)
        if (kotlin.math.abs(previewRatio - 4.0/3.0) <= kotlin.math.abs(previewRatio - 16.0/9.0)) {
            return AspectRatio.RATIO_4_3
        }
        return AspectRatio.RATIO_16_9
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
}