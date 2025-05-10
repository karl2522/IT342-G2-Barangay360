package com.example.barangay360_mobile.adapter

import android.graphics.Color
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button // If you add buttons
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.barangay360_mobile.R
import com.example.barangay360_mobile.api.models.EventResponse
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

class EventAdapter(
    private val onItemClicked: (EventResponse) -> Unit
) : ListAdapter<EventResponse, EventAdapter.ViewHolder>(EventDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_event, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val event = getItem(position)
        holder.bind(event)
    }

    inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val titleView: TextView = itemView.findViewById(R.id.event_title)
        private val dateTimeView: TextView = itemView.findViewById(R.id.event_datetime)
        private val locationView: TextView = itemView.findViewById(R.id.event_location)
        private val descriptionView: TextView = itemView.findViewById(R.id.event_description)
        private val colorBarView: View = itemView.findViewById(R.id.event_color_bar) // Reference to the color bar
        // private val btnViewDetails: Button = itemView.findViewById(R.id.btn_event_view_details)

        fun bind(event: EventResponse) {
            titleView.text = event.title ?: "Event Title"
            descriptionView.text = event.description ?: "No details available."

            dateTimeView.text = formatEventDateTime(event.start, event.end, event.allDay)

            if (!event.location.isNullOrBlank()) {
                locationView.text = "Location: ${event.location}"
                locationView.visibility = View.VISIBLE
            } else {
                locationView.visibility = View.GONE
            }

            // Set the color bar's background
            event.color?.let { colorString ->
                try {
                    colorBarView.setBackgroundColor(Color.parseColor(colorString))
                } catch (e: IllegalArgumentException) {
                    Log.w("EventAdapter", "Invalid color string for event ${event.id}: $colorString")
                    // Set a default color if parsing fails
                    colorBarView.setBackgroundColor(ContextCompat.getColor(itemView.context, R.color.maroon)) // Define this color
                }
            } ?: run {
                // No color provided, set a default color
                colorBarView.setBackgroundColor(ContextCompat.getColor(itemView.context, R.color.maroon)) // Define this color
            }

            itemView.setOnClickListener {
                onItemClicked(event)
            }
        }

        private fun formatEventDateTime(start: LocalDateTime?, end: LocalDateTime?, allDay: Boolean): String {
            if (start == null) return "Date/Time not specified" // Only need start if end is also potentially null

            val dateFormatter = DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM) // e.g., May 10, 2025
            val timeFormatter = DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT) // e.g., 7:00 AM

            val startDateStr = start.format(dateFormatter)
            val startTimeStr = start.format(timeFormatter)

            if (allDay) {
                return if (end != null && start.toLocalDate() != end.toLocalDate()) {
                    "$startDateStr - ${end.format(dateFormatter)}" // Multi-day all-day event
                } else {
                    startDateStr // Single all-day event
                }
            } else {
                val endTimeStr = end?.format(timeFormatter) ?: ""
                return if (end != null && start.toLocalDate() != end.toLocalDate()) {
                    "$startDateStr, $startTimeStr - ${end.format(dateFormatter)}, $endTimeStr" // Spans multiple days with specific times
                } else if (end != null) {
                    "$startDateStr, $startTimeStr - $endTimeStr" // Same day, specific times
                } else {
                    "$startDateStr, $startTimeStr" // Only start time known
                }
            }
        }
    }

    class EventDiffCallback : DiffUtil.ItemCallback<EventResponse>() {
        override fun areItemsTheSame(oldItem: EventResponse, newItem: EventResponse): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: EventResponse, newItem: EventResponse): Boolean {
            return oldItem == newItem
        }
    }
}