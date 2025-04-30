package com.example.barangay360_mobile.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.example.barangay360_mobile.api.ApiClient
import com.example.barangay360_mobile.api.models.ServiceRequestRequest
import com.example.barangay360_mobile.api.models.ServiceRequestResponse
import com.example.barangay360_mobile.util.SessionManager
import kotlinx.coroutines.launch

class ServiceRequestViewModel(application: Application) : AndroidViewModel(application) {
    private val _serviceRequestResult = MutableLiveData<ServiceRequestResponse?>()
    val serviceRequestResult: LiveData<ServiceRequestResponse?> = _serviceRequestResult

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    private val sessionManager = SessionManager.getInstance()

    fun submitServiceRequest(request: ServiceRequestRequest) {
        viewModelScope.launch {
            try {
                val token = sessionManager.getAuthToken()
                if (token == null) {
                    _error.value = "Authentication token not found. Please log in again."
                    return@launch
                }

                val response = ApiClient.serviceRequestService.createServiceRequest(request)
                
                if (response.isSuccessful && response.body() != null) {
                    _serviceRequestResult.value = response.body()
                    _error.value = null
                } else {
                    _error.value = "Failed to submit request: ${response.message()}"
                    _serviceRequestResult.value = null
                }
            } catch (e: Exception) {
                _error.value = "Error: ${e.message}"
                _serviceRequestResult.value = null
            }
        }
    }
}