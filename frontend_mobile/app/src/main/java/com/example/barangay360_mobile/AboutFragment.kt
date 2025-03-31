package com.example.barangay360_mobile

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.Toast
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class AboutFragment : Fragment() {
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inflate the layout for this fragment
        val view = inflater.inflate(R.layout.fragment_about, container, false)

        // Initialize SwipeRefreshLayout
        swipeRefreshLayout = view.findViewById(R.id.swipeRefreshLayout)
        swipeRefreshLayout.setColorSchemeResources(R.color.maroon)
        swipeRefreshLayout.setOnRefreshListener {
            // Simulate refresh operation
            swipeRefreshLayout.postDelayed({
                swipeRefreshLayout.isRefreshing = false
                Toast.makeText(context, "Information updated", Toast.LENGTH_SHORT).show()
            }, 1500)
        }

        // Set up button clicks
        setupButtonClicks(view)

        return view
    }

    private fun setupButtonClicks(view: View) {
        // Important Links
        view.findViewById<Button>(R.id.btn_figma).setOnClickListener {
            openUrl("https://figma.com/your-figma-link")
        }

        view.findViewById<Button>(R.id.btn_diagrams).setOnClickListener {
            openUrl("https://your-diagrams-link.com")
        }

        view.findViewById<Button>(R.id.btn_project).setOnClickListener {
            openUrl("https://github.com/your-project-board")
        }

        // GitHub Links
        view.findViewById<Button>(R.id.btn_github_james).setOnClickListener {
            openUrl("https://github.com/james-username")
        }

        view.findViewById<Button>(R.id.btn_github_fred).setOnClickListener {
            openUrl("https://github.com/fred-username")
        }

        view.findViewById<Button>(R.id.btn_github_carl).setOnClickListener {
            openUrl("https://github.com/carl-username")
        }
    }

    private fun openUrl(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(context, "Could not open the link", Toast.LENGTH_SHORT).show()
        }
    }
}