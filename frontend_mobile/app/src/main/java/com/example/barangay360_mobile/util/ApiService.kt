package com.example.barangay360_mobile.util

import okhttp3.OkHttpClient
import okhttp3.Interceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiService {
    // Updated to match the URL in ApiClient for consistency
    private const val BASE_URL = "https://barangay360-nja7q.ondigitalocean.app/"

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(AuthInterceptor())
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    fun <T> buildService(service: Class<T>): T {
        return retrofit.create(service)
    }
}

class AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain) = chain.run {
        val sessionManager = SessionManager.getInstance()
        val token = sessionManager?.getAuthToken()
        
        proceed(
            request()
                .newBuilder()
                .apply {
                    token?.let {
                        addHeader("Authorization", "Bearer $it")
                    }
                }
                .build()
        )
    }
}