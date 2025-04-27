package com.example.barangay360_mobile.api

import android.content.Context
import com.example.barangay360_mobile.util.SessionManager
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import com.google.gson.GsonBuilder // Import GsonBuilder
import com.google.gson.TypeAdapter
import com.google.gson.stream.JsonReader
import com.google.gson.stream.JsonToken // Import JsonToken
import com.google.gson.stream.JsonWriter
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.util.concurrent.TimeUnit

object ApiClient {
    // Update to match your Spring Boot server
    // For emulator, use 10.0.2.2 to reach host machine's localhost
    // For physical devices on same WiFi network, use computer's actual IP address
    private const val BASE_URL = "http://192.168.1.23:8080/"

    private lateinit var sessionManager: SessionManager

    // Initialize with application context
    fun init(context: Context) {
        sessionManager = SessionManager(context)
    }

    // Custom TypeAdapter for OffsetDateTime
    class OffsetDateTimeAdapter : TypeAdapter<OffsetDateTime>() {
        // Use ISO_OFFSET_DATE_TIME formatter for parsing and formatting
        private val formatter = DateTimeFormatter.ISO_OFFSET_DATE_TIME

        override fun write(out: JsonWriter, value: OffsetDateTime?) {
            if (value == null) {
                out.nullValue()
            } else {
                out.value(value.format(formatter))
            }
        }

        override fun read(input: JsonReader): OffsetDateTime? {
            if (input.peek() == JsonToken.NULL) {
                input.nextNull()
                return null
            }
            val dateString = input.nextString()
            return try {
                OffsetDateTime.parse(dateString, formatter)
            } catch (e: Exception) {
                // Log error or handle other potential formats
                null // Or throw an exception if strict parsing is required
            }
        }
    }

    // Gson instance with custom adapter
    private val gson = GsonBuilder()
        .registerTypeAdapter(OffsetDateTime::class.java, OffsetDateTimeAdapter())
        .create()


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
            .addConverterFactory(GsonConverterFactory.create(gson)) // Use custom Gson
            .build()
    }

    private val apiRetrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(authenticatedClient) // Protected endpoints need token
            .addConverterFactory(GsonConverterFactory.create(gson)) // Use custom Gson
            .build()
    }

    val authService: AuthService by lazy {
        authRetrofit.create(AuthService::class.java)
    }

    val userService: UserService by lazy {
        apiRetrofit.create(UserService::class.java)
    }

    // Add the AnnouncementService instance
    val announcementService: AnnouncementService by lazy {
        // Assuming announcements require authentication. If not, use authRetrofit
        apiRetrofit.create(AnnouncementService::class.java)
    }
}