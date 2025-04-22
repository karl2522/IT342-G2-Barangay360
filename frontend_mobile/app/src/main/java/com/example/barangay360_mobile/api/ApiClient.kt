package com.example.barangay360_mobile.api

import android.content.Context
import com.example.barangay360_mobile.util.SessionManager
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {
    // Update to match your Spring Boot server
    // For emulator, use 10.0.2.2 to reach host machine's localhost
    // For physical devices on same WiFi network, use computer's actual IP address
    private const val BASE_URL = "http://192.168.1.2:8080/"
    
    private lateinit var sessionManager: SessionManager
    
    // Initialize with application context
    fun init(context: Context) {
        sessionManager = SessionManager(context)
    }

    private val authenticatedClient by lazy {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val authInterceptor = AuthInterceptor(sessionManager)

        OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .addInterceptor(authInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    private val standardClient by lazy {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    private val authRetrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(standardClient) // Auth endpoints don't need token
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    private val apiRetrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(authenticatedClient) // Protected endpoints need token
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    val authService: AuthService by lazy {
        authRetrofit.create(AuthService::class.java)
    }
    
    val userService: UserService by lazy {
        apiRetrofit.create(UserService::class.java)
    }
}