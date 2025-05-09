package com.example.barangay360_mobile.api

import android.content.Context
import android.util.Log
import com.example.barangay360_mobile.util.SessionManager
import com.google.gson.GsonBuilder
import com.google.gson.JsonDeserializationContext
import com.google.gson.JsonDeserializer
import com.google.gson.JsonElement
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.lang.reflect.Type
import java.time.Instant
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.concurrent.TimeUnit

object ApiClient {
    // Use 10.0.2.2 for localhost when using Android Emulator
    //http://192.168.56.1:8080/
    //http://192.168.254.181:8080/
    private const val BASE_URL = "https://barangay360-nja7q.ondigitalocean.app/"
    private lateinit var sessionManager: SessionManager

    // Create a proper instance of the logging interceptor (outside of any function)
    private val loggingInterceptor by lazy {
        HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
    }

    val communityFeedService: CommunityFeedService
        get() = try {
            retrofit.create(CommunityFeedService::class.java)
        } catch (e: Exception) {
            // Fall back to basic retrofit if there's an error
            createBasicRetrofit().create(CommunityFeedService::class.java)
        }

    // Initialize retrofit with a basic implementation
    // This will be replaced with the authenticated version in init()
    private var retrofit: Retrofit = createBasicRetrofit()

    // Service for token refresh operations (using a basic retrofit without auth interceptor)
    private val tokenRefreshService: AuthService by lazy {
        val tempRetrofit = createBasicRetrofit()
        tempRetrofit.create(AuthService::class.java)
    }

    fun init(context: Context) {
        try {
            sessionManager = SessionManager.getInstance()
            // Replace the basic retrofit with the authenticated one
            retrofit = createAuthenticatedRetrofit()
        } catch (e: Exception) {
            // Log error but don't crash the app
            e.printStackTrace()
        }
    }

    // Custom deserializer to handle LocalDateTime to OffsetDateTime conversion
    private class DateTimeDeserializer : JsonDeserializer<OffsetDateTime> {
        override fun deserialize(
            json: JsonElement,
            typeOfT: Type?,
            context: JsonDeserializationContext?
        ): OffsetDateTime? {
            return try {
                val dateStr = json.asString
                // Parse the backend's LocalDateTime string
                val localDateTime = LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                // Convert to OffsetDateTime using system default zone
                localDateTime.atZone(ZoneId.systemDefault()).toOffsetDateTime()
            } catch (e: Exception) {
                Log.e("ApiClient", "Failed to parse date: ${json.asString}", e) // Add this log
                null // This will cause dates to be null if parsing fails
            }
        }
    }

    // Custom deserializer for Instant
    private class InstantDeserializer : JsonDeserializer<Instant> {
        override fun deserialize(
            json: JsonElement,
            typeOfT: Type?,
            context: JsonDeserializationContext?
        ): Instant? {
            return try {
                val timestamp = json.asString
                Instant.parse(timestamp)
            } catch (e: Exception) {
                try {
                    // Try parsing as seconds since epoch
                    Instant.ofEpochSecond(json.asLong)
                } catch (e: Exception) {
                    null
                }
            }
        }
    }

    private fun createBasicRetrofit(): Retrofit {
        try {
            val httpClient = OkHttpClient.Builder()
                .apply {
                    // Only add the interceptor if it's initialized
                    addInterceptor(loggingInterceptor)
                }
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build()

            val gson = GsonBuilder()
                .registerTypeAdapter(OffsetDateTime::class.java, DateTimeDeserializer())
                .registerTypeAdapter(Instant::class.java, InstantDeserializer())
                .setLenient() // Add this to handle malformed JSON responses
                .create()

            return Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(httpClient)
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build()
        } catch (e: Exception) {
            e.printStackTrace()
            // Provide a fallback retrofit instance without interceptors
            val basicClient = OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build()

            val gson = GsonBuilder()
                .setLenient()
                .create()

            return Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(basicClient)
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build()
        }
    }

    private fun createAuthenticatedRetrofit(): Retrofit {
        try {
            // Make sure sessionManager is initialized before using it
            if (!::sessionManager.isInitialized) {
                throw IllegalStateException("ApiClient must be initialized with init() before using authenticated services")
            }

            // Create a separate instance of TokenAuthenticator for token refresh
            val tokenAuthenticator = TokenAuthenticator(sessionManager, tokenRefreshService)

            // Create a separate instance of AuthInterceptor for adding token to requests
            val authInterceptor = AuthInterceptor(sessionManager)

            val httpClient = OkHttpClient.Builder()
                .apply {
                    // Only add interceptors if they're initialized
                    addInterceptor(loggingInterceptor)
                    addInterceptor(authInterceptor) // Add token to all requests
                }
                .authenticator(tokenAuthenticator) // Handle 401 responses
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build()

            val gson = GsonBuilder()
                .registerTypeAdapter(OffsetDateTime::class.java, DateTimeDeserializer())
                .registerTypeAdapter(Instant::class.java, InstantDeserializer())
                .setLenient() // Add this to handle malformed JSON responses
                .create()

            return Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(httpClient)
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build()
        } catch (e: Exception) {
            // If anything goes wrong, fall back to the basic retrofit
            e.printStackTrace()
            return createBasicRetrofit()
        }
    }

    // Service interfaces - use the authenticated retrofit instance
    val authService: AuthService
        get() = try {
            retrofit.create(AuthService::class.java)
        } catch (e: Exception) {
            // Fall back to basic retrofit if there's an error
            createBasicRetrofit().create(AuthService::class.java)
        }

    val userService: UserService
        get() = try {
            retrofit.create(UserService::class.java)
        } catch (e: Exception) {
            createBasicRetrofit().create(UserService::class.java)
        }

    val announcementService: AnnouncementService
        get() = try {
            retrofit.create(AnnouncementService::class.java)
        } catch (e: Exception) {
            createBasicRetrofit().create(AnnouncementService::class.java)
        }

    val serviceRequestService: ServiceRequestService
        get() = try {
            retrofit.create(ServiceRequestService::class.java)
        } catch (e: Exception) {
            createBasicRetrofit().create(ServiceRequestService::class.java)
        }
}