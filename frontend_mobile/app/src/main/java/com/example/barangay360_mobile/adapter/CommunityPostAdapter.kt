package com.example.barangay360_mobile.adapter

import android.content.res.ColorStateList
// ... other imports from your CommunityPostAdapter.kt file
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.example.barangay360_mobile.R
import com.example.barangay360_mobile.api.models.CommunityPostResponse
import com.example.barangay360_mobile.api.models.ForumComment
import com.example.barangay360_mobile.util.SessionManager
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

class CommunityPostAdapter(
    private val lifecycleOwner: LifecycleOwner,
    private val onItemClicked: (CommunityPostResponse) -> Unit,
    private val onLikePostClicked: (CommunityPostResponse) -> Unit,
    private val onCommentIconClicked: (post: CommunityPostResponse, postViewHolder: ViewHolder) -> Unit,
    private val onSendCommentClicked: (postId: Long, content: String, postViewHolder: ViewHolder) -> Unit,
    // This signature should match how it's used in CommunityFragment
    private val onLikeCommentClicked: (comment: ForumComment, postViewHolder: ViewHolder) -> Unit
) : ListAdapter<CommunityPostResponse, CommunityPostAdapter.ViewHolder>(CommunityPostDiffCallback()) {

    private val sessionManager = SessionManager.getInstance()
    private val currentUserId = sessionManager.getUserId()?.toLongOrNull()

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_community, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val post = getItem(position)
        holder.bind(post)
    }

    inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val userNameView: TextView = itemView.findViewById(R.id.community_user_name)
        val postDateView: TextView = itemView.findViewById(R.id.community_post_date)
        val titleView: TextView = itemView.findViewById(R.id.community_title)
        val descriptionView: TextView = itemView.findViewById(R.id.community_description)
        val postImageView: ImageView = itemView.findViewById(R.id.iv_post_image)
        val likeCountView: TextView = itemView.findViewById(R.id.like_count)
        val commentCountView: TextView = itemView.findViewById(R.id.comment_count)
        val btnLikePostIcon: ImageButton = itemView.findViewById(R.id.btn_like_icon)
        val btnCommentIcon: ImageButton = itemView.findViewById(R.id.btn_comment_icon)

        val rvComments: RecyclerView = itemView.findViewById(R.id.rv_comments)
        val layoutAddComment: LinearLayout = itemView.findViewById(R.id.layout_add_comment)
        val etCommentInput: EditText = itemView.findViewById(R.id.et_comment_input)
        val btnSendComment: ImageButton = itemView.findViewById(R.id.btn_send_comment)
        val tvCommentsHeader: TextView = itemView.findViewById(R.id.tv_comments_header)
        val dividerBeforeComments: View = itemView.findViewById(R.id.divider_before_comments)

        lateinit var commentAdapter: CommentAdapter
        var areCommentsVisible = false
        var commentsLoaded = false
        var isLoadingComments = false

        fun bind(post: CommunityPostResponse) {
            val authorName = post.author?.let { "${it.firstName ?: ""} ${it.lastName ?: ""}".trim() }
                ?: post.author?.username
                ?: "Anonymous"
            userNameView.text = authorName
            titleView.text = post.title ?: "No Title"
            descriptionView.text = post.content

            val displayDate = post.updatedAt ?: post.createdAt
            displayDate?.let {
                try {
                    val formatter = DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM).withLocale(Locale.getDefault())
                    postDateView.text = "Posted: ${it.format(formatter)}"
                } catch (e: Exception) { postDateView.text = "Date unavailable" }
            } ?: run { postDateView.text = "Date unavailable" }

            likeCountView.text = "${post.actualLikesCount} likes"
            commentCountView.text = "${post.actualCommentsCount} comments" // This uses CommentStub count

            post.imageUrl?.let { url ->
                if (url.isNotBlank()) {
                    postImageView.visibility = View.VISIBLE
                    Glide.with(itemView.context).load(url)
                        .placeholder(R.drawable.barangay360_logo)
                        .error(R.drawable.barangay360_logo)
                        .into(postImageView)
                } else { postImageView.visibility = View.GONE }
            } ?: run { postImageView.visibility = View.GONE }

            if (post.isLikedByCurrentUser) {
                btnLikePostIcon.imageTintList = ColorStateList.valueOf(ContextCompat.getColor(itemView.context, R.color.maroon))
            } else {
                btnLikePostIcon.imageTintList = ColorStateList.valueOf(ContextCompat.getColor(itemView.context, R.color.text_secondary))
            }

            commentAdapter = CommentAdapter(
                onLikeClicked = { commentToLike ->
                    onLikeCommentClicked(commentToLike, this@ViewHolder)
                },
                currentUserId = currentUserId
            )
            rvComments.layoutManager = LinearLayoutManager(itemView.context)
            rvComments.adapter = commentAdapter
            rvComments.isNestedScrollingEnabled = false

            btnCommentIcon.setOnClickListener { onCommentIconClicked(post, this) }
            btnSendComment.setOnClickListener {
                val commentContent = etCommentInput.text.toString().trim()
                if (commentContent.isNotEmpty()) {
                    onSendCommentClicked(post.id, commentContent, this)
                } else {
                    Toast.makeText(itemView.context, "Comment cannot be empty", Toast.LENGTH_SHORT).show()
                }
            }
            itemView.setOnClickListener { onItemClicked(post) }
            btnLikePostIcon.setOnClickListener { onLikePostClicked(post) }
            toggleCommentsVisibility(areCommentsVisible, post.actualCommentsCount > 0)
        }

        fun toggleCommentsVisibility(show: Boolean, hasCommentsInitially: Boolean) {
            areCommentsVisible = show
            val baseVisibility = if (show) View.VISIBLE else View.GONE
            // Only show rvComments if it's expanded, comments are loaded, AND there are comments.
            rvComments.visibility = if (show && commentsLoaded && commentAdapter.itemCount > 0) View.VISIBLE else View.GONE
            layoutAddComment.visibility = baseVisibility

            val showHeaderAndDivider = show && commentsLoaded && commentAdapter.itemCount > 0
            dividerBeforeComments.visibility = if (showHeaderAndDivider) View.VISIBLE else View.GONE
            tvCommentsHeader.visibility = if (showHeaderAndDivider) View.VISIBLE else View.GONE
        }

        fun showLoadingComments(isLoading: Boolean) {
            isLoadingComments = isLoading
            if (isLoading) {
                rvComments.visibility = View.GONE
                tvCommentsHeader.visibility = View.GONE
                dividerBeforeComments.visibility = View.GONE
                // Show a progress bar here if you have one in item_community.xml for comments
            }
            // else hide progress bar
        }
    }
}

class CommunityPostDiffCallback : DiffUtil.ItemCallback<CommunityPostResponse>() {
    override fun areItemsTheSame(oldItem: CommunityPostResponse, newItem: CommunityPostResponse): Boolean {
        return oldItem.id == newItem.id
    }

    override fun areContentsTheSame(oldItem: CommunityPostResponse, newItem: CommunityPostResponse): Boolean {
        return oldItem.title == newItem.title &&
                oldItem.content == newItem.content &&
                oldItem.imageUrl == newItem.imageUrl &&
                oldItem.author?.id == newItem.author?.id &&
                oldItem.actualLikesCount == newItem.actualLikesCount &&
                oldItem.actualCommentsCount == newItem.actualCommentsCount && // Check this field too
                oldItem.isLikedByCurrentUser == newItem.isLikedByCurrentUser
    }
}