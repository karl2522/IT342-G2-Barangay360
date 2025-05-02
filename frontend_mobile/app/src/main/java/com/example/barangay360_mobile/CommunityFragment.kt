package com.example.barangay360_mobile

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.example.barangay360_mobile.databinding.FragmentCommunityBinding

class CommunityFragment : Fragment() {
    private var _binding: FragmentCommunityBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCommunityBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupListeners()

        // For UI preview - show empty state
        binding.emptyStateContainer.visibility = View.VISIBLE
        binding.communitiesRecyclerView.visibility = View.GONE
    }

    private fun setupListeners() {
        // Find community button click
        binding.btnFindCommunity.setOnClickListener {
            Toast.makeText(requireContext(), "Find Community clicked", Toast.LENGTH_SHORT).show()
        }

        // Create community button click
        binding.btnCreateCommunity.setOnClickListener {
            Toast.makeText(requireContext(), "Create Community clicked", Toast.LENGTH_SHORT).show()
        }

        // Set up swipe refresh
        binding.swipeRefreshLayout.setOnRefreshListener {
            binding.swipeRefreshLayout.isRefreshing = false
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        fun newInstance() = CommunityFragment()
    }
}