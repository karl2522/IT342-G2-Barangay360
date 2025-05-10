package com.example.barangay360_mobile

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.barangay360_mobile.adapter.CommunityPostAdapter
// REMOVE THIS IMPORT: import com.example.barangay360_mobile.adapter.fetchCommentsForPost
import com.example.barangay360_mobile.api.ApiClient
import com.example.barangay360_mobile.api.models.CommentStub
import com.example.barangay360_mobile.api.models.CommunityPostResponse
import com.example.barangay360_mobile.api.models.ForumComment
import com.example.barangay360_mobile.databinding.FragmentCommunityBinding
import com.example.barangay360_mobile.util.SessionManager
import kotlinx.coroutines.launch

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
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCommunityBinding.inflate(inflater, container, false)
        sessionManager = SessionManager.getInstance() // Initialize here
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        // sessionManager is already initialized in onCreateView

        setupRecyclerView()
        setupListeners()
        setupCreatePostPrompt()

        parentFragmentManager.setFragmentResultListener("postCreated", viewLifecycleOwner) { _, _ ->
            Log.d("CommunityFragment", "Received postCreated result, refreshing list.")
            loadInitialCommunityPosts()
        }
        loadInitialCommunityPosts()
    }

    private fun setupRecyclerView() {
        binding.communitiesRecyclerView.layoutManager = LinearLayoutManager(context)
        communityPostAdapter = CommunityPostAdapter(
            lifecycleOwner = viewLifecycleOwner,
            onItemClicked = { post ->
//                Toast.makeText(context, "Clicked on post: ${post.title}", Toast.LENGTH_SHORT).show()
            },
            onLikePostClicked = { post ->
                handleLikePost(post)
            },
            onCommentIconClicked = { post, postViewHolder ->
                if (!postViewHolder.areCommentsVisible) {
                    postViewHolder.toggleCommentsVisibility(true, post.actualCommentsCount > 0)
                    if (!postViewHolder.commentsLoaded && post.actualCommentsCount > 0) {
                        fetchCommentsForPost(post.id, postViewHolder)
                    } else if (post.actualCommentsCount == 0) {
                        postViewHolder.commentAdapter.submitList(emptyList())
                        postViewHolder.toggleCommentsVisibility(true, false)
                    }
                } else {
                    postViewHolder.toggleCommentsVisibility(false, post.actualCommentsCount > 0)
                }
            },
            onSendCommentClicked = { postId, content, postViewHolder ->
                handleSendComment(postId, content, postViewHolder)
            },
            // Corrected lambda signature
            onLikeCommentClicked = { comment, postViewHolder ->
                handleLikeComment(comment, postViewHolder)
            }
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

    private fun fetchCommentsForPost(postId: Long, holder: CommunityPostAdapter.ViewHolder) {
        if (holder.isLoadingComments) return
        holder.showLoadingComments(true)

        if (!sessionManager.isLoggedIn()) {
            if (isAdded) Toast.makeText(context, "Login to see comments", Toast.LENGTH_SHORT).show()
            holder.showLoadingComments(false)
            return
        }

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                // The page and size parameters might be ignored by the backend if it's just returning a flat list.
                // Or, it might use them to limit the list without full PageResponse features.
                // For simplicity, we'll pass 0 and a reasonable size like 100 if no explicit pagination is done by backend for direct list.
                val response = ApiClient.communityFeedService.getCommentsForPost(postId, 0, 100) // Adjust size as needed
                if (!isAdded) return@launch

                if (response.isSuccessful) {
                    // Now 'comments' is directly the list from the response body
                    val comments: List<ForumComment> = response.body() ?: emptyList()
                    val currentUserIdFromSession = sessionManager.getUserId()?.toLongOrNull()

                    val processedComments = comments.map { comment ->
                        comment.isLikedByCurrentUser = comment.likes?.any { it.id == currentUserIdFromSession } == true
                        comment
                    }

                    holder.commentAdapter.submitList(processedComments)
                    holder.commentsLoaded = true
                    holder.toggleCommentsVisibility(true, processedComments.isNotEmpty())
                } else {
                    if (isAdded) Toast.makeText(holder.itemView.context, "Failed to load comments: ${response.code()} - ${response.message()}", Toast.LENGTH_SHORT).show()
                    Log.e("CommunityFragment", "Failed to load comments for post $postId: ${response.code()} - ${response.message()}")
                    holder.toggleCommentsVisibility(true, false) // Show input, but indicate no comments loaded
                }
            } catch (e: Exception) {
                if (isAdded) {
                    Log.e("CommunityFragment", "Error fetching comments for post $postId: ${e.message}", e)
                    Toast.makeText(holder.itemView.context, "Error loading comments", Toast.LENGTH_SHORT).show()
                }
                holder.toggleCommentsVisibility(true, false) // Show input, but indicate error/no comments
            } finally {
                if (isAdded) holder.showLoadingComments(false)
            }
        }
    }


    private fun handleSendComment(postId: Long, content: String, postViewHolder: CommunityPostAdapter.ViewHolder) {
        if (!sessionManager.isLoggedIn()) {
            Toast.makeText(context, "Please log in to comment.", Toast.LENGTH_SHORT).show()
            return
        }
        postViewHolder.etCommentInput.isEnabled = false
        postViewHolder.btnSendComment.isEnabled = false

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val response = ApiClient.communityFeedService.createComment(postId, content)
                if (!isAdded) return@launch

                if (response.isSuccessful) {
                    val newComment = response.body()
                    Toast.makeText(context, "Comment posted!", Toast.LENGTH_SHORT).show()
                    postViewHolder.etCommentInput.text.clear()
                    fetchCommentsForPost(postId, postViewHolder)

                    val currentPostIndex = communityPostAdapter.currentList.indexOfFirst { it.id == postId }
                    if (currentPostIndex != -1) {
                        val originalPost = communityPostAdapter.currentList[currentPostIndex]
                        val updatedCommentStubs = originalPost.comments?.toMutableList() ?: mutableListOf()
                        newComment?.let { nc -> updatedCommentStubs.add(CommentStub(id = nc.id)) }

                        val updatedPostForAdapter = originalPost.copy(comments = updatedCommentStubs)
                        val newList = communityPostAdapter.currentList.toMutableList()
                        newList[currentPostIndex] = updatedPostForAdapter
                        communityPostAdapter.submitList(newList)
                    }
                } else {
                    val errorBody = response.errorBody()?.string() ?: "Unknown error"
                    Toast.makeText(context, "Failed to post comment: ${response.code()} - $errorBody", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                if (isAdded) {
                    Toast.makeText(context, "Error posting comment: ${e.message}", Toast.LENGTH_LONG).show()
                }
            } finally {
                if (isAdded) {
                    postViewHolder.etCommentInput.isEnabled = true
                    postViewHolder.btnSendComment.isEnabled = true
                }
            }
        }
    }

    private fun handleLikeComment(comment: ForumComment, postViewHolder: CommunityPostAdapter.ViewHolder) {
        if (!sessionManager.isLoggedIn()) {
            Toast.makeText(context, "Please log in to like comments.", Toast.LENGTH_SHORT).show()
            return
        }
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val response = ApiClient.communityFeedService.toggleLikeComment(comment.id)
                if (isAdded && response.isSuccessful) {
                    val postIdToRefresh = getItemIdForViewHolder(postViewHolder)
                    if (postIdToRefresh != null) {
                        fetchCommentsForPost(postIdToRefresh, postViewHolder)
                    } else {
                        Log.e("CommunityFragment", "Could not find post ID to refresh comments after liking a comment.")
                    }
                } else if (isAdded) {
                    val errorBody = response.errorBody()?.string() ?: "Unknown error"
                    Toast.makeText(context, "Failed to update comment like: ${response.code()} - $errorBody", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                if (isAdded) {
                    Toast.makeText(context, "Error updating comment like: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun getItemIdForViewHolder(viewHolder: CommunityPostAdapter.ViewHolder): Long? {
        val position = viewHolder.adapterPosition
        return if (position != RecyclerView.NO_POSITION && position < communityPostAdapter.currentList.size) {
            communityPostAdapter.currentList[position].id
        } else {
            null
        }
    }

    private fun setupListeners() {
        binding.swipeRefreshLayout.setOnRefreshListener { loadInitialCommunityPosts() }
    }

    private fun setupCreatePostPrompt() {
        val firstName = sessionManager.getFirstName()
        binding.tvCreatePostPromptText.text = if (!firstName.isNullOrEmpty()) "What's on your mind, $firstName?" else "What's on your mind?"
        binding.cardCreatePostPrompt.setOnClickListener { navigateToCreatePost() }
        binding.btnAddPhotoPrompt.setOnClickListener { navigateToCreatePost(launchImagePicker = true) }
    }

    private fun navigateToCreatePost(launchImagePicker: Boolean = false) {
        if (sessionManager.isLoggedIn()) {
            val args = Bundle().apply { putBoolean("launchImagePicker", launchImagePicker) }
            parentFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, CreatePostFragment().apply { arguments = args })
                .addToBackStack(null).commit()
        } else {
            Toast.makeText(context, "Please log in to create a post.", Toast.LENGTH_SHORT).show()
        }
    }

    private fun loadInitialCommunityPosts() {
        currentPage = 0
        isLastPage = false
        if (::communityPostAdapter.isInitialized && communityPostAdapter.currentList.isNotEmpty()) {
            communityPostAdapter.submitList(null)
        }
        loadCommunityPosts(currentPage)
    }

    private fun loadMoreCommunityPosts() {
        currentPage++
        loadCommunityPosts(currentPage)
    }

    private fun processFetchedPosts(posts: List<CommunityPostResponse>): List<CommunityPostResponse> {
        val currentUserId = sessionManager.getUserId()?.toLongOrNull()
        return posts.map { post ->
            post.isLikedByCurrentUser = currentUserId?.let { userId -> post.likes?.any { it.id == userId } } ?: false
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
                    val processedPosts = processFetchedPosts(rawPosts)
                    isLastPage = pageResponse?.last ?: true
                    val completionCallback = Runnable { updateEmptyStateVisibility(communityPostAdapter.itemCount == 0, pageToLoad == 0) }
                    if (pageToLoad == 0) {
                        communityPostAdapter.submitList(processedPosts, completionCallback)
                    } else {
                        val currentList = communityPostAdapter.currentList.toMutableList()
                        currentList.addAll(processedPosts)
                        communityPostAdapter.submitList(currentList, completionCallback)
                    }
                } else {
                    if(isAdded) Toast.makeText(requireContext(), "Failed to load posts: ${response.code()}", Toast.LENGTH_SHORT).show()
                    if (pageToLoad == 0) {
                        if(::communityPostAdapter.isInitialized) communityPostAdapter.submitList(emptyList())
                        updateEmptyStateVisibility(true, true)
                    }
                }
            } catch (e: Exception) {
                if (isAdded) {
                    if (e !is kotlinx.coroutines.CancellationException) Toast.makeText(requireContext(), "Error loading posts: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
                    if (pageToLoad == 0) {
                        if(::communityPostAdapter.isInitialized) communityPostAdapter.submitList(emptyList())
                        updateEmptyStateVisibility(true, true)
                    }
                }
            } finally {
                if (isAdded) setLoadingState(false, pageToLoad == 0)
            }
        }
    }

    private fun handleLikePost(postToLike: CommunityPostResponse) {
        if (!sessionManager.isLoggedIn()) {
            Toast.makeText(context, "Please log in to like posts.", Toast.LENGTH_SHORT).show()
            return
        }
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val response = ApiClient.communityFeedService.toggleLikePost(postToLike.id)
                if (!isAdded) return@launch
                if (response.isSuccessful) {
                    response.body()?.let { updatedPostFromServer ->
                        val currentUserId = sessionManager.getUserId()?.toLongOrNull()
                        updatedPostFromServer.isLikedByCurrentUser = currentUserId?.let { userId ->
                            updatedPostFromServer.likes?.any { it.id == userId }
                        } ?: false
                        updatePostInAdapter(updatedPostFromServer)
                    }
                } else {
                    if (isAdded) Toast.makeText(context, "Failed to update like.", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                if (isAdded) Toast.makeText(context, "Error updating like: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun updatePostInAdapter(updatedPost: CommunityPostResponse) {
        val currentList = communityPostAdapter.currentList.toMutableList()
        val index = currentList.indexOfFirst { it.id == updatedPost.id }
        if (index != -1) {
            if (updatedPost.comments == null && currentList[index].comments != null) {
                updatedPost.comments = currentList[index].comments
            }
            currentList[index] = updatedPost
            communityPostAdapter.submitList(currentList)
        }
    }

    private fun setLoadingState(loading: Boolean, isInitialLoad: Boolean) {
        if (!isAdded || _binding == null) return
        isLoading = loading
        if (isInitialLoad) {
            binding.progressBar.visibility = if (loading && !binding.swipeRefreshLayout.isRefreshing) View.VISIBLE else View.GONE
        }
        if (!loading && _binding != null) {
            binding.swipeRefreshLayout.isRefreshing = false
        }
    }

    private fun updateEmptyStateVisibility(isEmpty: Boolean, isInitialLoad: Boolean) {
        if (!isAdded || _binding == null) return
        if (isInitialLoad) {
            binding.communitiesRecyclerView.visibility = if (isEmpty) View.GONE else View.VISIBLE
            binding.emptyStateContainer.visibility = if (isEmpty) View.VISIBLE else View.GONE
        } else if (!isEmpty && binding.communitiesRecyclerView.visibility == View.GONE) {
            binding.communitiesRecyclerView.visibility = View.VISIBLE
            binding.emptyStateContainer.visibility = View.GONE
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        if (::communityPostAdapter.isInitialized && _binding != null) {
            binding.communitiesRecyclerView.adapter = null
        }
        _binding = null
    }

    companion object {
        fun newInstance() = CommunityFragment()
    }
}