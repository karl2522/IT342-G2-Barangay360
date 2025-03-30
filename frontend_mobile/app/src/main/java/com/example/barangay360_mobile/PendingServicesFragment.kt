package com.example.barangay360_mobile

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class PendingServicesFragment : Fragment() {
    private lateinit var recyclerView: RecyclerView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_services_status, container, false)

        // Set up status label with appropriate styling
        val statusLabel = view.findViewById<TextView>(R.id.status_label)
        statusLabel.text = "Pending"
        statusLabel.setBackgroundResource(R.drawable.bg_status_pending)
        statusLabel.setTextColor(requireContext().getColor(android.R.color.holo_orange_dark))

        // Initialize RecyclerView
        recyclerView = view.findViewById(R.id.recycler_status_services)
        recyclerView.layoutManager = LinearLayoutManager(context)

        // Set up SwipeRefreshLayout
        swipeRefreshLayout = view.findViewById(R.id.swipeRefreshLayout)
        swipeRefreshLayout.setColorSchemeResources(
            android.R.color.holo_orange_dark
        )
        swipeRefreshLayout.setOnRefreshListener {
            refreshData()
        }

        // Set up navigation
        view.findViewById<View>(R.id.btn_back).setOnClickListener {
            requireActivity().supportFragmentManager.popBackStack()
        }

        // In each of the status fragments:
        view.findViewById<View>(R.id.tab_request_services).setOnClickListener {
            // Direct navigation to RequestServicesFragment
            requireActivity().supportFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, RequestServicesFragment())
                .addToBackStack(null)
                .commit()
        }
        // Load data
        loadPendingServices()

        return view
    }

    private fun loadPendingServices() {
        // TODO: Replace with actual data loading from your backend
        val services = listOf(
            ServiceItem("Street Light Repair", "Mar 25, 2025", "Flickering street light in front of house"),
            ServiceItem("Road Maintenance", "Mar 23, 2025", "Pothole repair needed"),
            ServiceItem("Medical Assistance", "Mar 20, 2025", "Senior citizen medical aid request")
        )

        recyclerView.adapter = ServiceAdapter(services)
    }

    private fun refreshData() {
        // Simulate network operation
        swipeRefreshLayout.postDelayed({
            loadPendingServices()
            swipeRefreshLayout.isRefreshing = false
            Toast.makeText(context, "Services refreshed", Toast.LENGTH_SHORT).show()
        }, 1500)
    }

    // Data class and adapter for services
    data class ServiceItem(val type: String, val date: String, val details: String)

    inner class ServiceAdapter(private val services: List<ServiceItem>) :
        RecyclerView.Adapter<ServiceAdapter.ServiceViewHolder>() {

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ServiceViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_service_status, parent, false)
            return ServiceViewHolder(view)
        }

        override fun onBindViewHolder(holder: ServiceViewHolder, position: Int) {
            val service = services[position]
            holder.bind(service)
        }

        override fun getItemCount() = services.size

        inner class ServiceViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            private val typeTextView: TextView = itemView.findViewById(R.id.service_type)
            private val dateTextView: TextView = itemView.findViewById(R.id.service_date)
            private val detailsTextView: TextView = itemView.findViewById(R.id.service_details)

            fun bind(service: ServiceItem) {
                typeTextView.text = service.type
                dateTextView.text = service.date
                detailsTextView.text = service.details
            }
        }
    }
}