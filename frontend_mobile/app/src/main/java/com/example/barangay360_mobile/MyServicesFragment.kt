package com.example.barangay360_mobile

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MyServicesFragment : Fragment() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var emptyStateView: LinearLayout
    private var servicesList = mutableListOf<ServiceRequest>()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.fragment_my_services, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Initialize views
        recyclerView = view.findViewById(R.id.recycler_services)
        emptyStateView = view.findViewById(R.id.empty_state_view)

        // Setup RecyclerView
        setupRecyclerView()

        // Load sample data
        loadSampleData()

        // Setup empty state button
        view.findViewById<Button>(R.id.btn_create_request).setOnClickListener {
            // Navigate to Request Services tab
            (parentFragment as? ServicesFragment)?.let {
                it.viewPager.currentItem = 0
            }
        }
    }

    private fun setupRecyclerView() {
        recyclerView.layoutManager = LinearLayoutManager(requireContext())
        val adapter = ServiceRequestAdapter(servicesList)
        recyclerView.adapter = adapter
    }

    private fun loadSampleData() {
        // Add sample data
        servicesList.add(
            ServiceRequest(
                "Barangay Clearance",
                "Need a barangay clearance for employment purposes",
                getCurrentDate(),
                "Pending"
            )
        )
        servicesList.add(
            ServiceRequest(
                "Business Permit",
                "Requesting business permit for my small online shop",
                getCurrentDate(),
                "Approved"
            )
        )
        servicesList.add(
            ServiceRequest(
                "Certificate of Residency",
                "Need proof of residency for scholarship application",
                getCurrentDate(),
                "Rejected"
            )
        )

        // Update UI based on data
        if (servicesList.isEmpty()) {
            recyclerView.visibility = View.GONE
            emptyStateView.visibility = View.VISIBLE
        } else {
            recyclerView.visibility = View.VISIBLE
            emptyStateView.visibility = View.GONE
            recyclerView.adapter?.notifyDataSetChanged()
        }
    }

    private fun getCurrentDate(): String {
        val dateFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
        return dateFormat.format(Date())
    }

    // Service Request data class
    data class ServiceRequest(
        val type: String,
        val description: String,
        val date: String,
        val status: String
    )

    // RecyclerView Adapter
    inner class ServiceRequestAdapter(private val services: List<ServiceRequest>) :
        RecyclerView.Adapter<ServiceRequestAdapter.ServiceViewHolder>() {

        inner class ServiceViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            val titleTextView: TextView = itemView.findViewById(R.id.service_title)
            val dateTextView: TextView = itemView.findViewById(R.id.service_date)
            val descriptionTextView: TextView = itemView.findViewById(R.id.service_description)
            val statusTextView: TextView = itemView.findViewById(R.id.service_status)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ServiceViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_service, parent, false)
            return ServiceViewHolder(view)
        }

        override fun onBindViewHolder(holder: ServiceViewHolder, position: Int) {
            val service = services[position]

            holder.titleTextView.text = service.type
            holder.dateTextView.text = service.date
            holder.descriptionTextView.text = service.description
            holder.statusTextView.text = service.status

            // Set background and text color based on status
            when (service.status) {
                "Approved" -> {
                    holder.statusTextView.setBackgroundResource(R.drawable.bg_status_approved)
                    holder.statusTextView.setTextColor(resources.getColor(android.R.color.white))
                }
                "Pending" -> {
                    holder.statusTextView.setBackgroundResource(R.drawable.bg_status_pending)
                    holder.statusTextView.setTextColor(resources.getColor(android.R.color.black))
                }
                "Rejected" -> {
                    holder.statusTextView.setBackgroundResource(R.drawable.bg_status_rejected)
                    holder.statusTextView.setTextColor(resources.getColor(R.color.design_default_color_error))
                }
            }
        }

        override fun getItemCount() = services.size
    }
}