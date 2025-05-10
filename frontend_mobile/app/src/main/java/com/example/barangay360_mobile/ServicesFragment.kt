package com.example.barangay360_mobile

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.setFragmentResultListener
import androidx.navigation.fragment.findNavController
// import com.google.android.material.floatingactionbutton.FloatingActionButton

class ServicesFragment : Fragment() {
    // private lateinit var fab: FloatingActionButton

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_services, container, false)
        // fab = view.findViewById(R.id.fab_new_request)

        // Set up FAB click listener
        // fab.setOnClickListener {
        //     navigateToRequestForm()
        // }

        // Replace the ViewPager with MyServicesFragment directly
        childFragmentManager.beginTransaction()
            .replace(R.id.services_container, MyServicesFragment())
            .commit()

        return view
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Set up fragment result listener for QR code data
        parentFragmentManager.setFragmentResultListener("qrServiceData", viewLifecycleOwner) { _, bundle ->
            // Navigate directly to RequestServicesFragment with the QR data
            val fragment = RequestServicesFragment().apply {
                arguments = bundle
            }

            // Replace current fragment with RequestServicesFragment
            parentFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, fragment) // Assuming R.id.fragment_container is the main container in HomeActivity
                .addToBackStack(null)
                .commit()
        }
    }

    // private fun navigateToRequestForm() {
    //     val fragment = RequestServicesFragment()
    //     parentFragmentManager.beginTransaction()
    //         .replace(R.id.fragment_container, fragment) // Assuming R.id.fragment_container is the main container in HomeActivity
    //         .addToBackStack(null)
    //         .commit()
    // }
}