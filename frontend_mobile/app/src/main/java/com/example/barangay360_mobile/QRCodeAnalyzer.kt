package com.example.barangay360_mobile

import android.annotation.SuppressLint
import android.graphics.ImageFormat
import android.graphics.Rect
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.zxing.*
import com.google.zxing.common.HybridBinarizer
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicBoolean

class QRCodeAnalyzer(private val onQRCodeScanned: (String) -> Unit) : ImageAnalysis.Analyzer {

    // Track whether we're currently processing an image
    private val isProcessing = AtomicBoolean(false)

    // Last analyzed timestamp
    private var lastAnalyzedTimestamp = 0L

    // Increase scan interval to reduce processing load (1000ms = 1 analysis per second)
    private val scanInterval = 1000L

    // Pre-initialize the reader with specific configuration for better performance
    private val multiFormatReader = MultiFormatReader().apply {
        val hints = mapOf(
            DecodeHintType.POSSIBLE_FORMATS to arrayListOf(BarcodeFormat.QR_CODE),
            DecodeHintType.TRY_HARDER to false, // Turn off try_harder for speed
            DecodeHintType.CHARACTER_SET to "UTF-8"
        )
        setHints(hints)
    }

    @SuppressLint("UnsafeOptInUsageError")
    override fun analyze(image: ImageProxy) {
        // Quick early return if we're processing or it's too soon for another scan
        val currentTimestamp = System.currentTimeMillis()
        if (isProcessing.get() || currentTimestamp - lastAnalyzedTimestamp < scanInterval) {
            image.close()
            return
        }

        // Only handle the supported formats to avoid unnecessary processing
        if (image.format != ImageFormat.YUV_420_888) {
            image.close()
            return
        }

        isProcessing.set(true)

        try {
            // Get the Y plane (luminance) only - more efficient for QR code detection
            val plane = image.planes[0]
            val buffer = plane.buffer
            val pixelStride = plane.pixelStride
            val rowStride = plane.rowStride

            // Focus on center portion of image for faster processing
            val width = image.width
            val height = image.height

            // Get the center 50% of the image for analysis
            val centerX = width / 2
            val centerY = height / 2
            val scanAreaSize = minOf(width, height) / 2 // 50% of the smaller dimension

            // Calculate scan area boundaries
            val left = centerX - scanAreaSize / 2
            val top = centerY - scanAreaSize / 2
            val right = centerX + scanAreaSize / 2
            val bottom = centerY + scanAreaSize / 2

            // Extract the data for the smaller area
            val bytes = ByteArray(scanAreaSize * scanAreaSize) // Only allocate for scan area

            // Copy center portion of the image
            var index = 0
            for (y in top until bottom) {
                val offset = y * rowStride
                for (x in left until right step pixelStride) {
                    if (index < bytes.size) {
                        bytes[index++] = buffer.get(offset + x)
                    }
                }
            }

            // Create source from the smaller data
            val source = PlanarYUVLuminanceSource(
                bytes,
                scanAreaSize,
                scanAreaSize,
                0,
                0,
                scanAreaSize,
                scanAreaSize,
                false
            )

            val binaryBitmap = BinaryBitmap(HybridBinarizer(source))

            try {
                val result = multiFormatReader.decodeWithState(binaryBitmap)
                lastAnalyzedTimestamp = currentTimestamp
                onQRCodeScanned(result.text)
            } catch (e: NotFoundException) {
                // No QR code found
            } finally {
                // Reset for next detection
                multiFormatReader.reset()
            }
        } catch (e: Exception) {
            // Log exception but don't crash
        } finally {
            isProcessing.set(false)
            image.close()
        }
    }
}