package com.example.barangay360_mobile

import android.annotation.SuppressLint
import android.graphics.ImageFormat
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.zxing.*
import com.google.zxing.common.HybridBinarizer
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicBoolean

class QRCodeAnalyzer(private val onQRCodeScanned: (String) -> Unit) : ImageAnalysis.Analyzer {
    private val isProcessing = AtomicBoolean(false)
    private var lastAnalyzedTimestamp = 0L
    private val scanInterval = 500L

    private val multiFormatReader = MultiFormatReader().apply {
        val hints = mapOf(
            DecodeHintType.POSSIBLE_FORMATS to arrayListOf(BarcodeFormat.QR_CODE),
            DecodeHintType.TRY_HARDER to true,
            DecodeHintType.CHARACTER_SET to "UTF-8"
        )
        setHints(hints)
    }

    @SuppressLint("UnsafeOptInUsageError")
    override fun analyze(image: ImageProxy) {
        if (isProcessing.get() || System.currentTimeMillis() - lastAnalyzedTimestamp < scanInterval) {
            image.close()
            return
        }

        if (image.format != ImageFormat.YUV_420_888) {
            image.close()
            return
        }

        isProcessing.set(true)

        try {
            val buffer = image.planes[0].buffer
            val data = buffer.toByteArray()
            
            val source = PlanarYUVLuminanceSource(
                data,
                image.width,
                image.height,
                0,
                0,
                image.width,
                image.height,
                false
            )

            val binaryBitmap = BinaryBitmap(HybridBinarizer(source))

            try {
                val result = multiFormatReader.decodeWithState(binaryBitmap)
                if (result.text.isNotEmpty()) {
                    lastAnalyzedTimestamp = System.currentTimeMillis()
                    onQRCodeScanned(result.text)
                }
            } catch (e: NotFoundException) {
                try {
                    val invertedBitmap = BinaryBitmap(HybridBinarizer(source.invert()))
                    val result = multiFormatReader.decodeWithState(invertedBitmap)
                    if (result.text.isNotEmpty()) {
                        lastAnalyzedTimestamp = System.currentTimeMillis()
                        onQRCodeScanned(result.text)
                    }
                } catch (e: NotFoundException) {
                    // No QR code found
                }
            }
        } catch (e: Exception) {
            // Log exception but don't crash
        } finally {
            isProcessing.set(false)
            image.close()
            multiFormatReader.reset()
        }
    }

    private fun ByteBuffer.toByteArray(): ByteArray {
        rewind()
        val data = ByteArray(remaining())
        get(data)
        return data
    }
}