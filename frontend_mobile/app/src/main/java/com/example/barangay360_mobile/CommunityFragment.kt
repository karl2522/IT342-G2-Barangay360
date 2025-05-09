package com.example.barangay360_mobile

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.barangay360_mobile.adapter.CommunityPostAdapter
import com.example.barangay360_mobile.api.ApiClient
import com.example.barangay360_mobile.api.models.CommunityPostResponse
import com.example.barangay360_mobile.databinding.FragmentCommunityBinding
import com.example.barangay360_mobile.util.SessionManager
import kotlinx.coroutines.launch
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

class CommunityFragment : Fragment() {
    private var _binding: FragmentCommunityBinding? = null
    private val binding get() = _binding!!

    private lateinit var sessionManager: SessionManager
    private lateinit var communityPostAdapter: CommunityPostAdapter

    private var currentPage = 0
    private val pageSize = 10
    private var isLoading = false
    private var isLastPage = false

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
        sessionManager = SessionManager.getInstance()
        setupRecyclerView()
        setupListeners()
        loadInitialCommunityPosts()
    }

    private fun setupRecyclerView() {
        binding.communitiesRecyclerView.layoutManager = LinearLayoutManager(context)
        communityPostAdapter = CommunityPostAdapter(
            onItemClicked = { post ->
                Toast.makeText(context, "Clicked on: ${post.title}", Toast.LENGTH_SHORT).show()
            },
            onLikeClicked = { post ->
                Toast.makeText(context, "Liked: ${post.title}", Toast.LENGTH_SHORT).show()
            },
            onCommentClicked = { post ->
                Toast.makeText(context, "Comment on: ${post.title}", Toast.LENGTH_SHORT).show()
            },
//            onShareClicked = { post ->
//                sharePost(post)
//            }
        )
        binding.communitiesRecyclerView.adapter = communityPostAdapter
        binding.communitiesRecyclerView.addOnScrollListener(object : RecyclerView.OnScrollListener() {
            override fun onScrolled(recyclerView: RecyclerView, dx: Int, dy: Int) {
                super.onScrolled(recyclerView, dx, dy)
                val layoutManager = recyclerView.layoutManager as LinearLayoutManager
                val visibleItemCount = layoutManager.childCount
                val totalItemCount = layoutManager.itemCount
                val firstVisibleItemPosition = layoutManager.findFirstVisibleItemPosition()

                if (!isLoading && !isLastPage) {
                    if ((visibleItemCount + firstVisibleItemPosition) >= totalItemCount && firstVisibleItemPosition >= 0 && totalItemCount >= pageSize) {
                        loadMoreCommunityPosts()
                    }
                }
            }
        })
    }

    private fun setupListeners() {
        binding.swipeRefreshLayout.setOnRefreshListener {
            loadInitialCommunityPosts()
        }
    }

    private fun loadInitialCommunityPosts() {
        currentPage = 0
        isLastPage = false
        // It's good practice to clear the adapter or show a loading state for the adapter itself
        // if your submitList doesn't immediately clear previous items on a new initial load.
        // However, ListAdapter's submitList should handle replacing the list.
        communityPostAdapter.submitList(emptyList())
        loadCommunityPosts(currentPage)
    }

    private fun loadMoreCommunityPosts() {
        currentPage++
        loadCommunityPosts(currentPage)
    }

    private fun loadCommunityPosts(pageToLoad: Int) {
        if (isLoading || (isLastPage && pageToLoad != 0)) return
        setLoadingState(true, pageToLoad == 0)

        if (!sessionManager.isLoggedIn()) {
            if (isAdded) Toast.makeText(context, "Please log in to view community posts.", Toast.LENGTH_LONG).show()
            setLoadingState(false, true)
            updateEmptyStateVisibility(true, pageToLoad == 0)
            return
        }

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val response = ApiClient.communityFeedService.getCommunityPosts(pageToLoad, pageSize)
                if (!isAdded) return@launch

                if (response.isSuccessful) {
                    val pageResponse = response.body()
                    val posts = pageResponse?.content ?: emptyList()

                    Log.d("CommunityFragment", "Fetched ${posts.size} posts. Page: $pageToLoad. Is last page: ${pageResponse?.last}")
                    posts.forEachIndexed { index, post ->
                        Log.d("CommunityFragment", "Post $index ID: ${post.id}, Title: ${post.title}, Author: ${post.author?.username}, Likes: ${post.likes?.size}, Comments: ${post.comments?.size}")
                    }

                    isLastPage = pageResponse?.last ?: true

                    val completionCallback = Runnable {
                        // This code runs after submitList has finished processing
                        Log.d("CommunityFragment", "submitList completed. Adapter itemCount: ${communityPostAdapter.itemCount}")
                        updateEmptyStateVisibility(communityPostAdapter.itemCount == 0, pageToLoad == 0)
                    }

                    if (pageToLoad == 0) {
                        communityPostAdapter.submitList(posts, completionCallback) // Pass the callback
                    } else {
                        val currentList = communityPostAdapter.currentList.toMutableList()
                        currentList.addAll(posts)
                        communityPostAdapter.submitList(currentList, completionCallback) // Pass the callback
                    }
                    updateEmptyStateVisibility(communityPostAdapter.itemCount == 0, pageToLoad == 0)
                    // *******************************************************************

                } else {
                    Log.e("CommunityFragment", "API Error: ${response.code()} - ${response.message()}")
                    if(isAdded) Toast.makeText(requireContext(), "Failed to load posts: ${response.code()}", Toast.LENGTH_SHORT).show()
                    if (pageToLoad == 0) {
                        communityPostAdapter.submitList(emptyList()) // Ensure list is cleared on error for initial load
                        updateEmptyStateVisibility(true, true)
                    }
                }
            } catch (e: Exception) {
                if (isAdded) {
                    Log.e("CommunityFragment", "Exception: ${e.message}", e)
                    if (e !is kotlinx.coroutines.CancellationException) {
                        if(isAdded) Toast.makeText(requireContext(), "Error loading posts: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
                    }
                    if (pageToLoad == 0) {
                        communityPostAdapter.submitList(emptyList()) // Ensure list is cleared on error for initial load
                        updateEmptyStateVisibility(true, true)
                    }
                }
            } finally {
                if (isAdded) {
                    setLoadingState(false, pageToLoad == 0)
                }
            }
        }
    }

    private fun setLoadingState(loading: Boolean, isInitialLoad: Boolean) {
        if (!isAdded || _binding == null) return
        isLoading = loading
        if (isInitialLoad) {
            binding.progressBar.visibility = if (loading && !binding.swipeRefreshLayout.isRefreshing) View.VISIBLE else View.GONE
        }
        if (!loading) {
            binding.swipeRefreshLayout.isRefreshing = false
        }
    }

    private fun updateEmptyStateVisibility(isEmpty: Boolean, isInitialLoad: Boolean) {
        if (!isAdded || _binding == null) return

        if (isInitialLoad) { // Only show/hide empty state on initial load or full refresh
            binding.communitiesRecyclerView.visibility = if (isEmpty) View.GONE else View.VISIBLE
            binding.emptyStateContainer.visibility = if (isEmpty) View.VISIBLE else View.GONE
            // Add the log I suggested here if it's not already there:
            Log.d("CommunityFragment", "updateEmptyStateVisibility (InitialLoad): isEmpty=$isEmpty. RecyclerView Visible: ${binding.communitiesRecyclerView.visibility == View.VISIBLE}, EmptyState Visible: ${binding.emptyStateContainer.visibility == View.VISIBLE}")
        } else if (!isEmpty && binding.communitiesRecyclerView.visibility == View.GONE) {
            // If loading more and it's not empty, and recycler was previously hidden, show it.
            binding.communitiesRecyclerView.visibility = View.VISIBLE
            binding.emptyStateContainer.visibility = View.GONE
            Log.d("CommunityFragment", "updateEmptyStateVisibility (LoadMore, NotEmpty, RecyclerHidden): RecyclerView Visible: ${binding.communitiesRecyclerView.visibility == View.VISIBLE}, EmptyState Visible: ${binding.emptyStateContainer.visibility == View.VISIBLE}")
        }
        // Consider what happens if it's NOT an initial load AND isEmpty IS true
        // (e.g., user scrolls to load more, but the next page is empty - though isLastPage should prevent this call)
    }

    private fun sharePost(post: CommunityPostResponse) {
        if (!isAdded) return
        val shareIntent = Intent(Intent.ACTION_SEND)
        shareIntent.type = "text/plain"

        val authorName = post.author?.let { "${it.firstName ?: ""} ${it.lastName ?: ""}".trim() }
            ?: post.author?.username
            ?: "Anonymous"
        val displayDate = (post.updatedAt ?: post.createdAt)?.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM)) ?: "N/A"

        val shareContent = """
            Check out this post from the Barangay360 Community!
            
            Title: ${post.title ?: "No Title"}
            By: $authorName
            Date: $displayDate

            ${post.content ?: ""}

            - Shared from Barangay360 App
        """.trimIndent()
        shareIntent.putExtra(Intent.EXTRA_SUBJECT, "[Barangay360 Community] ${post.title ?: "Post"}")
        shareIntent.putExtra(Intent.EXTRA_TEXT, shareContent)
        startActivity(Intent.createChooser(shareIntent, "Share Post"))
    }

    override fun onDestroyView() {
        super.onDestroyView()
        binding.communitiesRecyclerView.adapter = null // Clear adapter reference
        _binding = null
    }

    companion object {
        fun newInstance() = CommunityFragment()
    }
}