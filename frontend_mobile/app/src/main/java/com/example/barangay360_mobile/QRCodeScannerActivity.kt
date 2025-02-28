package com.example.barangay360_mobile

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.View
import android.view.animation.AlphaAnimation
import android.view.animation.Animation
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.cardview.widget.CardView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.camera.view.PreviewView
import com.google.zxing.BinaryBitmap
import com.google.zxing.MultiFormatReader
import com.google.zxing.NotFoundException
import com.google.zxing.PlanarYUVLuminanceSource
import com.google.zxing.common.HybridBinarizer
import java.nio.ByteBuffer
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import android.widget.ProgressBar

class QRCodeScannerActivity : AppCompatActivity() {
    private lateinit var cameraExecutor: ExecutorService
    private lateinit var previewView: PreviewView
    private lateinit var scannerOverlay: QRScannerOverlayView
    private lateinit var scanInstructionsText: TextView
    private lateinit var scanButton: Button

    // Result view references
    private lateinit var resultLayout: CardView // Change type to CardView
    private lateinit var qrContentText: TextView
    private lateinit var closeButton: Button
    private lateinit var loadingIndicator: ProgressBar

    private val CAMERA_PERMISSION_REQUEST_CODE = 100

    @SuppressLint("MissingInflatedId")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_qr_code_scanner)

        // Initialize views
        previewView = findViewById(R.id.previewView)
        scannerOverlay = findViewById(R.id.scannerOverlay)
        scanInstructionsText = findViewById(R.id.scanInstructionsText)
        scanButton = findViewById(R.id.scanButton)

        // Initialize result view directly
        resultLayout = findViewById(R.id.resultCard)
        qrContentText = findViewById(R.id.qrContentText)
        closeButton = findViewById(R.id.closeButton)
        loadingIndicator = findViewById(R.id.loadingIndicator)

        cameraExecutor = Executors.newSingleThreadExecutor()

        // Set click listeners
        scanButton.setOnClickListener {
            if (checkCameraPermission()) {
                startScanning()
            } else {
                requestCameraPermission()
            }
        }

        closeButton.setOnClickListener {
            hideResult()
        }
    }

    private fun checkCameraPermission(): Boolean {
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

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == CAMERA_PERMISSION_REQUEST_CODE &&
            grantResults.isNotEmpty() &&
            grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            startScanning()
        }
    }

    private fun startScanning() {
        // Show scanner overlay and hide scan button
        scanButton.visibility = View.GONE
        scannerOverlay.visibility = View.VISIBLE
        scanInstructionsText.visibility = View.VISIBLE

        // Start camera
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()

            // Set up the preview
            val preview = Preview.Builder().build()
            preview.setSurfaceProvider(previewView.surfaceProvider)

            // Set up image analysis
            val imageAnalysis = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()

            imageAnalysis.setAnalyzer(cameraExecutor) { imageProxy ->
                val buffer: ByteBuffer = imageProxy.planes[0].buffer
                val bytes = ByteArray(buffer.remaining())
                buffer.get(bytes)
                val source = PlanarYUVLuminanceSource(
                    bytes,
                    imageProxy.width,
                    imageProxy.height,
                    0,
                    0,
                    imageProxy.width,
                    imageProxy.height,
                    false
                )
                val binaryBitmap = BinaryBitmap(HybridBinarizer(source))
                try {
                    val result = MultiFormatReader().decode(binaryBitmap)
                    runOnUiThread {
                        showResult(result.text)
                    }
                } catch (e: NotFoundException) {
                    // No QR code found
                } finally {
                    imageProxy.close()
                }
            }

            // Select back camera
            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

            // Unbind any previous use cases
            cameraProvider.unbindAll()

            // Bind use cases to camera
            cameraProvider.bindToLifecycle(
                this,
                cameraSelector,
                preview,
                imageAnalysis
            )

        }, ContextCompat.getMainExecutor(this))
    }

    private fun showResult(text: String) {
        // Stop the scanner overlay animations
        scannerOverlay.stopAnimations()

        // Hide scanner elements
        scannerOverlay.visibility = View.INVISIBLE
        scanInstructionsText.visibility = View.INVISIBLE

        // Show result card with fade-in animation
        qrContentText.text = text
        resultLayout.visibility = View.VISIBLE

        val fadeIn = AlphaAnimation(0f, 1f)
        fadeIn.duration = 500
        fadeIn.fillAfter = true
        resultLayout.startAnimation(fadeIn)
    }

    private fun hideResult() {
        // Hide result with fade-out animation
        val fadeOut = AlphaAnimation(1f, 0f)
        fadeOut.duration = 500
        fadeOut.fillAfter = true
        fadeOut.setAnimationListener(object : Animation.AnimationListener {
            override fun onAnimationStart(animation: Animation?) {}
            override fun onAnimationEnd(animation: Animation?) {
                resultLayout.visibility = View.GONE
                scanButton.visibility = View.VISIBLE
            }
            override fun onAnimationRepeat(animation: Animation?) {}
        })
        resultLayout.startAnimation(fadeOut)
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }
}