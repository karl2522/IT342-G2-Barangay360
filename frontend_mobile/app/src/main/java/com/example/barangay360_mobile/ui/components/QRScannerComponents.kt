package com.example.barangay360_mobile.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.Button
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.unit.dp
import com.example.barangay360_mobile.ui.theme.QRScannerColors

@Composable
fun ScannerOverlay(
    modifier: Modifier = Modifier,
) {
    val infiniteTransition = rememberInfiniteTransition()

    // Scan line animation
    val scanLineY by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        )
    )

    // Pulsing animation
    val scale by infiniteTransition.animateFloat(
        initialValue = 0.98f,
        targetValue = 1.02f,
        animationSpec = infiniteRepeatable(
            animation = tween(700, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        )
    )

    Box(modifier = modifier) {
        Canvas(
            modifier = Modifier
                .size(260.dp * scale)
                .align(Alignment.Center)
        ) {
            val width = size.width
            val height = size.height
            val cornerLength = 40f
            val lineWidth = 8f

            // Draw the scanner frame with rounded corners
            // Top-left corner
            drawLine(
                color = QRScannerColors.ScannerCorners,
                start = Offset(0f, lineWidth/2),
                end = Offset(cornerLength, lineWidth/2),
                strokeWidth = lineWidth,
                cap = StrokeCap.Round
            )
            drawLine(
                color = QRScannerColors.ScannerCorners,
                start = Offset(lineWidth/2, 0f),
                end = Offset(lineWidth/2, cornerLength),
                strokeWidth = lineWidth,
                cap = StrokeCap.Round
            )

            // Top-right corner
            drawLine(
                color = QRScannerColors.ScannerCorners,
                start = Offset(width - cornerLength, lineWidth/2),
                end = Offset(width, lineWidth/2),
                strokeWidth = lineWidth,
                cap = StrokeCap.Round
            )
            drawLine(
                color = QRScannerColors.ScannerCorners,
                start = Offset(width - lineWidth/2, 0f),
                end = Offset(width - lineWidth/2, cornerLength),
                strokeWidth = lineWidth,
                cap = StrokeCap.Round
            )

            // Bottom-left corner
            drawLine(
                color = QRScannerColors.ScannerCorners,
                start = Offset(0f, height - lineWidth/2),
                end = Offset(cornerLength, height - lineWidth/2),
                strokeWidth = lineWidth,
                cap = StrokeCap.Round
            )
            drawLine(
                color = QRScannerColors.ScannerCorners,
                start = Offset(lineWidth/2, height - cornerLength),
                end = Offset(lineWidth/2, height),
                strokeWidth = lineWidth,
                cap = StrokeCap.Round
            )

            // Bottom-right corner
            drawLine(
                color = QRScannerColors.ScannerCorners,
                start = Offset(width - cornerLength, height - lineWidth/2),
                end = Offset(width, height - lineWidth/2),
                strokeWidth = lineWidth,
                cap = StrokeCap.Round
            )
            drawLine(
                color = QRScannerColors.ScannerCorners,
                start = Offset(width - lineWidth/2, height - cornerLength),
                end = Offset(width - lineWidth/2, height),
                strokeWidth = lineWidth,
                cap = StrokeCap.Round
            )

            // Draw scan line
            drawLine(
                color = QRScannerColors.ScanLine,
                start = Offset(0f, scanLineY * height),
                end = Offset(width, scanLineY * height),
                strokeWidth = 3f,
                cap = StrokeCap.Round,
            )
        }

        Text(
            text = "Position QR code inside the frame",
            color = QRScannerColors.TextColor,
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 80.dp)
        )
    }
}

@Composable
fun QRResultCard(
    qrContent: String,
    onDismiss: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(QRScannerColors.LoadingBackground)
            .padding(32.dp),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight(),
            shape = RoundedCornerShape(16.dp),
            color = QRScannerColors.CardBackground,
            tonalElevation = 8.dp
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "QR Code Detected",
                    style = MaterialTheme.typography.headlineSmall,
                    color = Color.Black
                )

                Spacer(modifier = Modifier.height(16.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFFEEEEEE))
                        .padding(16.dp)
                ) {
                    Text(
                        text = qrContent,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.Black
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    Button(
                        onClick = onDismiss,
                        modifier = Modifier.wrapContentWidth()
                    ) {
                        Text("Close")
                    }
                }
            }
        }
    }
}