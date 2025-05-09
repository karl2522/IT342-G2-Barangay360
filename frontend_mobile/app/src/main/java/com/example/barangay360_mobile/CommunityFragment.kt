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
import com.example.barangay360_mobile.api.models.UserLikeStub
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
                // Potentially navigate to post details screen
            },
            onLikeClicked = { post ->
                handleLikeClicked(post)
            },
            onCommentClicked = { post ->
                Toast.makeText(context, "Comment on: ${post.title}", Toast.LENGTH_SHORT).show()
                // Potentially open a comment dialog or screen
            }
            // Share functionality removed
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
        communityPostAdapter.submitList(emptyList())
        loadCommunityPosts(currentPage)
    }

    private fun loadMoreCommunityPosts() {
        currentPage++
        loadCommunityPosts(currentPage)
    }

    private fun processFetchedPosts(posts: List<CommunityPostResponse>): List<CommunityPostResponse> {
        val currentUserId = sessionManager.getUserId()?.toLongOrNull()
        return posts.map { post ->
            post.isLikedByCurrentUser = currentUserId?.let { userId ->
                post.likes?.any { it.id == userId }
            } ?: false
            post
        }
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
                    val rawPosts = pageResponse?.content ?: emptyList()
                    val processedPosts = processFetchedPosts(rawPosts) // Process for liked status

                    Log.d("CommunityFragment", "Fetched ${processedPosts.size} posts. Page: $pageToLoad. Is last page: ${pageResponse?.last}")
                    processedPosts.forEachIndexed { index, post ->
                        Log.d("CommunityFragment", "Post $index ID: ${post.id}, Title: ${post.title}, Author: ${post.author?.username}, Likes: ${post.actualLikesCount}, Comments: ${post.actualCommentsCount}, LikedByMe: ${post.isLikedByCurrentUser}")
                    }

                    isLastPage = pageResponse?.last ?: true

                    val completionCallback = Runnable {
                        Log.d("CommunityFragment", "submitList completed. Adapter itemCount: ${communityPostAdapter.itemCount}")
                        updateEmptyStateVisibility(communityPostAdapter.itemCount == 0, pageToLoad == 0)
                    }

                    if (pageToLoad == 0) {
                        communityPostAdapter.submitList(processedPosts, completionCallback)
                    } else {
                        val currentList = communityPostAdapter.currentList.toMutableList()
                        currentList.addAll(processedPosts)
                        communityPostAdapter.submitList(currentList, completionCallback)
                    }
                } else {
                    Log.e("CommunityFragment", "API Error: ${response.code()} - ${response.message()}")
                    if(isAdded) Toast.makeText(requireContext(), "Failed to load posts: ${response.code()}", Toast.LENGTH_SHORT).show()
                    if (pageToLoad == 0) {
                        communityPostAdapter.submitList(emptyList())
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
                        communityPostAdapter.submitList(emptyList())
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

    private fun handleLikeClicked(postToLike: CommunityPostResponse) {
        if (!sessionManager.isLoggedIn()) {
            Toast.makeText(context, "Please log in to like posts.", Toast.LENGTH_SHORT).show()
            return
        }
        // Optimistic UI update (optional, but makes UI feel responsive)
        // val originalLikedState = postToLike.isLikedByCurrentUser
        // val originalLikes = postToLike.likes?.toMutableList() ?: mutableListOf()
        // val currentUserId = sessionManager.getUserId()?.toLongOrNull()

        // if (originalLikedState) { // If liked, unlike
        //     postToLike.isLikedByCurrentUser = false
        //     currentUserId?.let { uid -> originalLikes.removeAll { it.id == uid } }
        // } else { // If not liked, like
        //     postToLike.isLikedByCurrentUser = true
        //     currentUserId?.let { uid -> originalLikes.add(UserLikeStub(id = uid, username = sessionManager.getFirstName())) } // Add basic stub
        // }
        // postToLike.likes = originalLikes // Update the list
        // updatePostInAdapter(postToLike)


        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val response = ApiClient.communityFeedService.toggleLikePost(postToLike.id)
                if (!isAdded) return@launch

                if (response.isSuccessful) {
                    response.body()?.let { updatedPostFromServer ->
                        // Process the updated post to set isLikedByCurrentUser correctly
                        val currentUserId = sessionManager.getUserId()?.toLongOrNull()
                        updatedPostFromServer.isLikedByCurrentUser = currentUserId?.let { userId ->
                            updatedPostFromServer.likes?.any { it.id == userId }
                        } ?: false
                        Log.d("CommunityFragment", "Like successful. Post ${updatedPostFromServer.id}, LikedByMe: ${updatedPostFromServer.isLikedByCurrentUser}, Likes: ${updatedPostFromServer.actualLikesCount}")
                        updatePostInAdapter(updatedPostFromServer)
                    }
                } else {
                    // Revert optimistic update if it failed
                    // postToLike.isLikedByCurrentUser = originalLikedState
                    // postToLike.likes = originalLikes // Revert the list
                    // updatePostInAdapter(postToLike)
                    Log.e("CommunityFragment", "Failed to like post ${postToLike.id}: ${response.code()} - ${response.message()}")
                    if (isAdded) Toast.makeText(context, "Failed to update like.", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                if (isAdded) {
                    // Revert optimistic update
                    // postToLike.isLikedByCurrentUser = originalLikedState
                    // postToLike.likes = originalLikes // Revert the list
                    // updatePostInAdapter(postToLike)
                    Log.e("CommunityFragment", "Exception liking post ${postToLike.id}: ${e.message}", e)
                    Toast.makeText(context, "Error updating like.", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun updatePostInAdapter(updatedPost: CommunityPostResponse) {
        val currentList = communityPostAdapter.currentList.toMutableList()
        val index = currentList.indexOfFirst { it.id == updatedPost.id }
        if (index != -1) {
            currentList[index] = updatedPost
            communityPostAdapter.submitList(currentList)
            // No need to call notifyItemChanged explicitly if submitList with a new list is used.
            // If you were to modify the item in place, you'd use notifyItemChanged(index).
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
        Log.d("CommunityFragment", "updateEmptyStateVisibility: isEmpty=$isEmpty, isInitialLoad=$isInitialLoad, adapterItemCount=${communityPostAdapter.itemCount}")
        if (isInitialLoad) {
            binding.communitiesRecyclerView.visibility = if (isEmpty) View.GONE else View.VISIBLE
            binding.emptyStateContainer.visibility = if (isEmpty) View.VISIBLE else View.GONE
            Log.d("CommunityFragment", "RecyclerView visible: ${binding.communitiesRecyclerView.visibility == View.VISIBLE}, EmptyState visible: ${binding.emptyStateContainer.visibility == View.VISIBLE}")
        } else if (!isEmpty && binding.communitiesRecyclerView.visibility == View.GONE) {
            binding.communitiesRecyclerView.visibility = View.VISIBLE
            binding.emptyStateContainer.visibility = View.GONE
            Log.d("CommunityFragment", "Loading more - RecyclerView visible: ${binding.communitiesRecyclerView.visibility == View.VISIBLE}, EmptyState visible: ${binding.emptyStateContainer.visibility == View.VISIBLE}")
        }
    }

    // SharePost function removed as per user request to remove share button.
    // If you re-add share, make sure to define this function again.

    override fun onDestroyView() {
        super.onDestroyView()
        binding.communitiesRecyclerView.adapter = null
        _binding = null
    }

    companion object {
        fun newInstance() = CommunityFragment()
    }
}