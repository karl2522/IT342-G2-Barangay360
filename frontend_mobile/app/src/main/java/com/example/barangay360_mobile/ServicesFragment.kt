package com.example.barangay360_mobile

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.viewpager2.adapter.FragmentStateAdapter
import androidx.viewpager2.widget.ViewPager2
import com.google.android.material.tabs.TabLayout
import com.google.android.material.tabs.TabLayoutMediator

class ServicesFragment : Fragment() {
    private lateinit var tabLayout: TabLayout
    lateinit var viewPager: ViewPager2
    private lateinit var titleTextView: TextView
    private lateinit var backButton: ImageView

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inflate the layout for this fragment
        val view = inflater.inflate(R.layout.fragment_services, container, false)

        // Initialize views
        tabLayout = view.findViewById(R.id.tab_layout)
        viewPager = view.findViewById(R.id.viewPager)
        titleTextView = view.findViewById(R.id.tv_title)
        backButton = view.findViewById(R.id.btn_back)

        // Set up back button click listener
        backButton.setOnClickListener {
            // Navigate back to previous screen
            requireActivity().onBackPressed()
        }

        return view
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Set up adapter for ViewPager
        viewPager.adapter = ServicesPagerAdapter(this)

        // Connect TabLayout with ViewPager
        TabLayoutMediator(tabLayout, viewPager) { tab, position ->
            tab.text = when(position) {
                0 -> "Request Services"
                1 -> "My Services"
                else -> null
            }
        }.attach()

        // Update title based on selected tab
        tabLayout.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab) {
                when(tab.position) {
                    0 -> titleTextView.text = "Services"
                    1 -> titleTextView.text = "Services"
                }
            }

            override fun onTabUnselected(tab: TabLayout.Tab) {}
            override fun onTabReselected(tab: TabLayout.Tab) {}
        })
    }

    // ViewPager adapter
    private inner class ServicesPagerAdapter(fragment: Fragment) :
        FragmentStateAdapter(fragment) {

        override fun getItemCount(): Int = 2

        override fun createFragment(position: Int): Fragment {
            return when (position) {
                0 -> RequestServicesFragment()
                1 -> MyServicesFragment()
                else -> RequestServicesFragment()
            }
        }
    }
}