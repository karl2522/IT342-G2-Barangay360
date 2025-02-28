package com.example.barangay360_mobile

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import com.example.barangay360_mobile.ui.theme.Barangay360MobileTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            Barangay360MobileTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    Greeting(
                        name = "Android",
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    Button(onClick = {
        val intent = Intent(context, QRCodeScannerActivity::class.java)
        context.startActivity(intent)
    }) {
        Text(text = "Scan QR Code")
    }
    Button(onClick = {
        val intent = Intent(context, CameraActivity::class.java)
        context.startActivity(intent)
    }) {
        Text(text = "Open Camera")
    }
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    Barangay360MobileTheme {
        Greeting("Android Test")
    }
}