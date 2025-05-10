package com.example.barangay360_mobile.api

import android.content.Context
import android.util.Log
import com.example.barangay360_mobile.util.SessionManager
import com.google.gson.Gson
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
import java.time.LocalDateTime // <-- IMPORT THIS
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException // <-- IMPORT THIS
import java.util.concurrent.TimeUnit

object ApiClient {
    private const val BASE_URL = "https://barangay360-nja7q.ondigitalocean.app/" // Your base URL
    private lateinit var sessionManager: SessionManager

    private val loggingInterceptor by lazy {
        HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
    }

    // Custom Deserializer for OffsetDateTime (from your original code)
    private class OffsetDateTimeDeserializer : JsonDeserializer<OffsetDateTime> {
        override fun deserialize(
            json: JsonElement,
            typeOfT: Type?,
            context: JsonDeserializationContext?
        ): OffsetDateTime? {
            return try {
                val dateStr = json.asString
                // This was your original logic for OffsetDateTime, assuming backend sends LocalDateTime string
                // that needs to be converted to OffsetDateTime with system default zone.
                // If backend actually sends an OffsetDateTime string (e.g., with timezone info), this needs adjustment.
                val localDateTime = LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                localDateTime.atZone(ZoneId.systemDefault()).toOffsetDateTime()
            } catch (e: Exception) {
                Log.e("ApiClient", "Failed to parse OffsetDateTime: ${json.asString}", e)
                null
            }
        }
    }

    // Custom Deserializer for Instant (from your original code)
    private class InstantDeserializer : JsonDeserializer<Instant> {
        override fun deserialize(
            json: JsonElement,
            typeOfT: Type?,
            context: JsonDeserializationContext?
        ): Instant? {
            return try {
                Instant.parse(json.asString)
            } catch (e: Exception) {
                try {
                    Instant.ofEpochSecond(json.asLong)
                } catch (e2: Exception) {
                    Log.e("ApiClient", "Failed to parse Instant: ${json.asString}", e2)
                    null
                }
            }
        }
    }

    // *** ADDED/MODIFIED: Custom Deserializer for LocalDateTime ***
    private class LocalDateTimeDeserializer : JsonDeserializer<LocalDateTime> {
        override fun deserialize(
            json: JsonElement,
            typeOfT: Type?,
            context: JsonDeserializationContext?
        ): LocalDateTime? {
            val dateStr = json.asString
            return try {
                // Standard ISO format like "2025-04-11T16:00:00"
                LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            } catch (e: DateTimeParseException) {
                Log.e("ApiClient", "Failed to parse LocalDateTime (ISO_LOCAL_DATE_TIME) for: $dateStr", e)
                // You can add more fallback patterns here if your backend sometimes sends different formats
                // For example, if it sometimes includes milliseconds:
                // try {
                //     return LocalDateTime.parse(dateStr, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS"))
                // } catch (e2: DateTimeParseException) {
                //     Log.e("ApiClient", "Fallback parsing for LocalDateTime also failed for: $dateStr", e2)
                //     null
                // }
                null // Return null if all parsing attempts fail
            } catch (e: Exception) {
                Log.e("ApiClient", "Generic error parsing LocalDateTime for: $dateStr", e)
                null
            }
        }
    }

    private fun createGson(): Gson {
        return GsonBuilder()
            .registerTypeAdapter(OffsetDateTime::class.java, OffsetDateTimeDeserializer())
            .registerTypeAdapter(Instant::class.java, InstantDeserializer())
            .registerTypeAdapter(LocalDateTime::class.java, LocalDateTimeDeserializer()) // REGISTER LocalDateTimeDeserializer
            .setLenient() // Keep if your backend sometimes sends slightly malformed JSON
            .create()
    }

    // Retrofit instance using the custom Gson object
    private val retrofit: Retrofit by lazy {
        // Ensure sessionManager is initialized if needed by createAuthenticatedRetrofit
        // For now, let's assume it will be initialized by the time this is first accessed.
        if (::sessionManager.isInitialized) {
            createAuthenticatedRetrofit()
        } else {
            // Fallback or throw error if sessionManager is critical for all Retrofit instances
            // For simplicity here, creating a basic one. In a real app, init() should guarantee sessionManager.
            Log.w("ApiClient", "SessionManager not initialized when creating Retrofit. Using basic setup.")
            createBasicRetrofit()
        }
    }

    // It's better to have a single source of truth for the Retrofit instance.
    // The lazy delegate 'retrofit' above will call createAuthenticatedRetrofit (or basic) on first access.
    // The init method should ensure that 'sessionManager' is ready before this happens.

    fun init(context: Context) {
        if (!::sessionManager.isInitialized) { // Check if already initialized
            sessionManager = SessionManager.getInstance() // Ensure SessionManager is initialized via getInstance
            // which should have been called in Application class.
        }
        // The 'retrofit' property will be lazily initialized with the correct setup when first accessed.
        // No need to re-assign retrofit here.
    }


    private fun createBasicOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor) // Add logging for all requests
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    private fun createBasicRetrofit(): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(createBasicOkHttpClient())
            .addConverterFactory(GsonConverterFactory.create(createGson()))
            .build()
    }

    private fun createAuthenticatedRetrofit(): Retrofit {
        if (!::sessionManager.isInitialized) {
            Log.e("ApiClient", "CRITICAL: SessionManager not initialized before creating authenticated Retrofit client.")
            // Potentially throw an exception or fall back to basic, but this indicates an init order problem.
            // For now, we'll proceed, but this should be fixed by ensuring init() is called first.
        }

        val authInterceptor = AuthInterceptor(sessionManager)
        // Assuming tokenRefreshService is needed by TokenAuthenticator
        val tokenRefreshService: AuthService by lazy { // Lazy init for token refresh service with basic client
            Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(createBasicOkHttpClient()) // Token refresh should not use auth interceptor
                .addConverterFactory(GsonConverterFactory.create(createGson()))
                .build()
                .create(AuthService::class.java)
        }
        val tokenAuthenticator = TokenAuthenticator(sessionManager, tokenRefreshService)


        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .addInterceptor(authInterceptor)
            .authenticator(tokenAuthenticator)
            .connectTimeout(60, TimeUnit.SECONDS) // Increased timeout
            .readTimeout(60, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(createGson()))
            .build()
    }

    // Service Properties (Lazy Initialization)
    val authService: AuthService by lazy { retrofit.create(AuthService::class.java) }
    val userService: UserService by lazy { retrofit.create(UserService::class.java) }
    val announcementService: AnnouncementService by lazy { retrofit.create(AnnouncementService::class.java) }
    val serviceRequestService: ServiceRequestService by lazy { retrofit.create(ServiceRequestService::class.java) }
    val communityFeedService: CommunityFeedService by lazy { retrofit.create(CommunityFeedService::class.java) }
    val eventService: EventService by lazy { retrofit.create(EventService::class.java) } // ADDED
}