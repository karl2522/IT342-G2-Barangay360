package com.example.barangay360_mobile

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import androidx.viewpager2.adapter.FragmentStateAdapter
import androidx.viewpager2.widget.ViewPager2
import com.google.android.material.tabs.TabLayout
import com.google.android.material.tabs.TabLayoutMediator

class ApprovedServicesFragment : Fragment() {
    private lateinit var recyclerView: RecyclerView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var tabLayout: TabLayout
    lateinit var viewPager: ViewPager2
    private lateinit var titleTextView: TextView

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_services_status, container, false)

        // Set up status label with appropriate styling
        val statusLabel = view.findViewById<TextView>(R.id.status_label)
        statusLabel.text = "Approved"
        statusLabel.setBackgroundResource(R.drawable.bg_status_approved)
        statusLabel.setTextColor(requireContext().getColor(android.R.color.holo_green_dark))

        // Initialize RecyclerView
        recyclerView = view.findViewById(R.id.recycler_status_services)
        recyclerView.layoutManager = LinearLayoutManager(context)

        // Set up SwipeRefreshLayout
        swipeRefreshLayout = view.findViewById(R.id.swipeRefreshLayout)
        swipeRefreshLayout.setColorSchemeResources(
            android.R.color.holo_green_dark
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
                .replace(R.id.fragment_container, ServicesFragment())
                .addToBackStack(null)
                .commit()
        }

        // Load data
        loadApprovedServices()

        return view
    }

    private fun loadApprovedServices() {
        // TODO: Replace with actual data loading from your backend
        val services = listOf(
            ServiceItem("Waste Management (Garbage Collection)", "Mar 15, 2025", "Regular weekly collection request"),
            ServiceItem("Pest Control (Inspection)", "Mar 10, 2025", "Inspection for termite infestation"),
            ServiceItem("Barangay Clearance", "Feb 28, 2025", "For business permit renewal")
        )

        recyclerView.adapter = ServiceAdapter(services)
    }

    private fun refreshData() {
        // Simulate network operation
        swipeRefreshLayout.postDelayed({
            loadApprovedServices()
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