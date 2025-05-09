package com.example.barangay360_mobile.adapter

import android.content.res.ColorStateList
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton // Changed from Button
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.example.barangay360_mobile.R
import com.example.barangay360_mobile.api.models.CommunityPostResponse
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

class CommunityPostAdapter(
    private val onItemClicked: (CommunityPostResponse) -> Unit,
    private val onLikeClicked: (CommunityPostResponse) -> Unit,
    private val onCommentClicked: (CommunityPostResponse) -> Unit
    // Share functionality removed
) : ListAdapter<CommunityPostResponse, CommunityPostAdapter.ViewHolder>(CommunityPostDiffCallback()) {

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
        private val userNameView: TextView = itemView.findViewById(R.id.community_user_name)
        private val postDateView: TextView = itemView.findViewById(R.id.community_post_date)
        private val titleView: TextView = itemView.findViewById(R.id.community_title)
        private val descriptionView: TextView = itemView.findViewById(R.id.community_description)
        private val postImageView: ImageView = itemView.findViewById(R.id.iv_post_image)
//        // Assuming you have an ImageView for author's profile in item_community.xml:
//        private val authorProfileImageView: ImageView? = itemView.findViewById(R.id.iv_author_profile)


        private val likeCountView: TextView = itemView.findViewById(R.id.like_count)
        private val commentCountView: TextView = itemView.findViewById(R.id.comment_count)

        private val btnLikeIcon: ImageButton = itemView.findViewById(R.id.btn_like_icon)
        private val btnCommentIcon: ImageButton = itemView.findViewById(R.id.btn_comment_icon)
        // Share button removed from here as well

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
                    val formatter = DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM)
                        .withLocale(Locale.getDefault())
                    postDateView.text = "Posted: ${it.format(formatter)}"
                } catch (e: Exception) {
                    postDateView.text = "Date unavailable"
                }
            } ?: run {
                postDateView.text = "Date unavailable"
            }

            // Use helper properties for counts
            likeCountView.text = "${post.actualLikesCount} likes"
            commentCountView.text = "${post.actualCommentsCount} comments"



            // Load post image
            post.imageUrl?.let { url ->
                if (url.isNotBlank()) {
                    postImageView.visibility = View.VISIBLE
                    Glide.with(itemView.context)
                        .load(url)
                        .placeholder(R.drawable.ic_launcher_background) // Replace with a proper placeholder
                        .error(R.drawable.ic_launcher_foreground)       // Replace
                        .into(postImageView)
                } else {
                    postImageView.visibility = View.GONE
                }
            } ?: run {
                postImageView.visibility = View.GONE
            }

            // Set Like Button State
            if (post.isLikedByCurrentUser) {
                btnLikeIcon.imageTintList = ColorStateList.valueOf(ContextCompat.getColor(itemView.context, R.color.maroon)) // Liked color
            } else {
                btnLikeIcon.imageTintList = ColorStateList.valueOf(ContextCompat.getColor(itemView.context, R.color.text_secondary)) // Default/Unliked color
            }


            itemView.setOnClickListener {
                onItemClicked(post)
            }
            btnLikeIcon.setOnClickListener {
                onLikeClicked(post)
                // UI update for like count and icon will now happen after API call via updatePostInAdapter
            }
            btnCommentIcon.setOnClickListener {
                onCommentClicked(post)
            }
            // Share button listener removed
        }
    }
}

// CommunityPostDiffCallback remains the same
class CommunityPostDiffCallback : DiffUtil.ItemCallback<CommunityPostResponse>() {
    override fun areItemsTheSame(oldItem: CommunityPostResponse, newItem: CommunityPostResponse): Boolean {
        return oldItem.id == newItem.id
    }

    override fun areContentsTheSame(oldItem: CommunityPostResponse, newItem: CommunityPostResponse): Boolean {
        // Be careful if your object has mutable lists that change content but not reference
        // For simplicity now, direct comparison is fine if backend returns a fresh object.
        return oldItem == newItem
    }
}