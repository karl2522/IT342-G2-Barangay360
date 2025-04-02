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

class MyServicesFragment : Fragment() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var emptyStateView: LinearLayout

    // Define service status categories
    private val STATUS_APPROVED = "approved"
    private val STATUS_PENDING = "pending"
    private val STATUS_REJECTED = "rejected"

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_my_services, container, false)

        recyclerView = view.findViewById(R.id.recycler_services)
        emptyStateView = view.findViewById(R.id.empty_state_view)

        // Setup RecyclerView
        recyclerView.layoutManager = LinearLayoutManager(context)

        // Load service status categories with sample data
        loadServiceCategories()

        // Setup "Request a Service" button in empty state
        view.findViewById<Button>(R.id.btn_create_request)?.setOnClickListener {
            navigateToRequestServices()
        }

        return view
    }

    private fun loadServiceCategories() {
        // Create our status categories with sample data
        val categories = listOf(
            CategoryWithSample(
                StatusCategory(STATUS_APPROVED, "Approved", R.drawable.bg_status_approved, R.color.approved_text, 3),
                ServiceItem("Barangay Clearance", "Mar 15, 2025", "For business permit renewal")
            ),
            CategoryWithSample(
                StatusCategory(STATUS_PENDING, "Pending", R.drawable.bg_status_pending, R.color.pending_text, 5),
                ServiceItem("Waste Management", "Mar 20, 2025", "Weekly garbage collection request")
            ),
            CategoryWithSample(
                StatusCategory(STATUS_REJECTED, "Rejected", R.drawable.bg_status_rejected, R.color.rejected_text, 2),
                ServiceItem("Building Permit", "Mar 12, 2025", "Incomplete documentation provided")
            )
        )

        // If we have categories to show, hide empty state
        if (categories.isNotEmpty()) {
            recyclerView.visibility = View.VISIBLE
            emptyStateView.visibility = View.GONE

            // Set adapter with status categories
            recyclerView.adapter = CategoryAdapter(categories)
        } else {
            // If no categories, show empty state
            recyclerView.visibility = View.GONE
            emptyStateView.visibility = View.VISIBLE
        }
    }

    private fun navigateToApprovedServices() {
        requireActivity().supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, ApprovedServicesFragment())
            .addToBackStack(null)
            .commit()
    }

    private fun navigateToPendingServices() {
        requireActivity().supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, PendingServicesFragment())
            .addToBackStack(null)
            .commit()
    }

    private fun navigateToRejectedServices() {
        requireActivity().supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, RejectedServicesFragment())
            .addToBackStack(null)
            .commit()
    }

    private fun navigateToRequestServices() {
        // Direct navigation to RequestServicesFragment
        requireActivity().supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, RequestServicesFragment())
            .addToBackStack(null)
            .commit()
    }

    // Model classes
    data class StatusCategory(
        val id: String,
        val title: String,
        val backgroundResId: Int,
        val textColorResId: Int,
        val count: Int
    )

    data class ServiceItem(
        val type: String,
        val date: String,
        val details: String
    )

    data class CategoryWithSample(
        val category: StatusCategory,
        val sampleService: ServiceItem
    )

    // Adapter for displaying categories with sample services
    inner class CategoryAdapter(
        private val categories: List<CategoryWithSample>
    ) : RecyclerView.Adapter<CategoryAdapter.ViewHolder>() {

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_service_category, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            holder.bind(categories[position])
        }

        override fun getItemCount() = categories.size

        inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            // Simplified findViewById calls with the new layout IDs
            private val statusLabel: TextView = itemView.findViewById(R.id.status_label)
            private val statusCount: TextView = itemView.findViewById(R.id.status_count)
            private val sampleTitle: TextView = itemView.findViewById(R.id.sample_service_title)
            private val sampleDate: TextView = itemView.findViewById(R.id.sample_service_date)
            private val sampleDetails: TextView = itemView.findViewById(R.id.sample_service_details)
            private val viewMoreButton: TextView = itemView.findViewById(R.id.btn_view_more)

            fun bind(categoryWithSample: CategoryWithSample) {
                val category = categoryWithSample.category
                val sample = categoryWithSample.sampleService

                // Set category header
                statusLabel.text = category.title
                statusCount.text = "${category.count} total"

                // Style the status label
                statusLabel.setBackgroundResource(category.backgroundResId)
                statusLabel.setTextColor(requireContext().getColor(category.textColorResId))

                // Set sample service data
                sampleTitle.text = sample.type
                sampleDate.text = sample.date
                sampleDetails.text = sample.details

                // Set view more button click
                viewMoreButton.setOnClickListener {
                    when (category.id) {
                        STATUS_APPROVED -> navigateToApprovedServices()
                        STATUS_PENDING -> navigateToPendingServices()
                        STATUS_REJECTED -> navigateToRejectedServices()
                    }
                }

                // Make the whole card clickable too
                itemView.setOnClickListener {
                    when (category.id) {
                        STATUS_APPROVED -> navigateToApprovedServices()
                        STATUS_PENDING -> navigateToPendingServices()
                        STATUS_REJECTED -> navigateToRejectedServices()
                    }
                }
            }
        }
    }
}
