package com.example.barangay360_mobile

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.View
import android.animation.ValueAnimator
import android.view.animation.LinearInterpolator

class QRScannerOverlayView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val framePaint = Paint().apply {
        color = Color.WHITE
        strokeWidth = 8f
        style = Paint.Style.STROKE
        isAntiAlias = true
    }

    private val cornerPaint = Paint().apply {
        color = Color.WHITE
        strokeWidth = 8f
        style = Paint.Style.STROKE
        isAntiAlias = true
    }

    private val scanLinePaint = Paint().apply {
        color = Color.RED
        strokeWidth = 4f
        style = Paint.Style.STROKE
        isAntiAlias = true
    }

    private val overlayPaint = Paint().apply {
        color = Color.parseColor("#80000000")
        style = Paint.Style.FILL
    }

    private val scanRect = RectF()
    private var scanLineY = 0f
    private var frameSize = 300f
    private var cornerSize = 40f

    private val scanLineAnimator = ValueAnimator.ofFloat(0f, 1f).apply {
        duration = 1500
        repeatCount = ValueAnimator.INFINITE
        repeatMode = ValueAnimator.RESTART
        interpolator = LinearInterpolator()
        addUpdateListener { animation ->
            scanLineY = animation.animatedValue as Float
            invalidate()
        }
    }

    private val pulseAnimator = ValueAnimator.ofFloat(0.98f, 1.02f).apply {
        duration = 700
        repeatCount = ValueAnimator.INFINITE
        repeatMode = ValueAnimator.REVERSE
        addUpdateListener { animation ->
            val scale = animation.animatedValue as Float
            frameSize = 300f * scale
            invalidate()
        }
    }

    init {
        // Start animations
        scanLineAnimator.start()
        pulseAnimator.start()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        // Calculate scanner position (center of screen)
        val centerX = width / 2f
        val centerY = height / 2f
        val halfFrame = frameSize / 2f

        scanRect.set(
            centerX - halfFrame,
            centerY - halfFrame,
            centerX + halfFrame,
            centerY + halfFrame
        )

        // Draw semi-transparent overlay
        canvas.drawRect(0f, 0f, width.toFloat(), scanRect.top, overlayPaint)
        canvas.drawRect(0f, scanRect.top, scanRect.left, scanRect.bottom, overlayPaint)
        canvas.drawRect(scanRect.right, scanRect.top, width.toFloat(), scanRect.bottom, overlayPaint)
        canvas.drawRect(0f, scanRect.bottom, width.toFloat(), height.toFloat(), overlayPaint)

        // Draw scanner frame
        canvas.drawRect(scanRect, framePaint)

        // Draw corners
        // Top-left
        canvas.drawLine(
            scanRect.left, scanRect.top,
            scanRect.left + cornerSize, scanRect.top,
            cornerPaint
        )
        canvas.drawLine(
            scanRect.left, scanRect.top,
            scanRect.left, scanRect.top + cornerSize,
            cornerPaint
        )

        // Top-right
        canvas.drawLine(
            scanRect.right - cornerSize, scanRect.top,
            scanRect.right, scanRect.top,
            cornerPaint
        )
        canvas.drawLine(
            scanRect.right, scanRect.top,
            scanRect.right, scanRect.top + cornerSize,
            cornerPaint
        )

        // Bottom-left
        canvas.drawLine(
            scanRect.left, scanRect.bottom,
            scanRect.left + cornerSize, scanRect.bottom,
            cornerPaint
        )
        canvas.drawLine(
            scanRect.left, scanRect.bottom - cornerSize,
            scanRect.left, scanRect.bottom,
            cornerPaint
        )

        // Bottom-right
        canvas.drawLine(
            scanRect.right - cornerSize, scanRect.bottom,
            scanRect.right, scanRect.bottom,
            cornerPaint
        )
        canvas.drawLine(
            scanRect.right, scanRect.bottom - cornerSize,
            scanRect.right, scanRect.bottom,
            cornerPaint
        )

        // Draw scan line
        val scanY = scanRect.top + (scanRect.height() * scanLineY)
        canvas.drawLine(scanRect.left, scanY, scanRect.right, scanY, scanLinePaint)
    }

    fun startAnimations() {
        scanLineAnimator.start()
        pulseAnimator.start()
    }

    fun stopAnimations() {
        scanLineAnimator.cancel()
        pulseAnimator.cancel()
    }

    override fun onDetachedFromWindow() {
        stopAnimations()
        super.onDetachedFromWindow()
    }
}