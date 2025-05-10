package com.example.barangay360_mobile.adapter

import android.content.res.ColorStateList
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.barangay360_mobile.R
import com.example.barangay360_mobile.api.models.ForumComment // Ensure this is your correct model
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

class CommentAdapter(
    private val onLikeClicked: (comment: ForumComment) -> Unit, // Changed: only expects ForumComment
    private val currentUserId: Long?
) : ListAdapter<ForumComment, CommentAdapter.ViewHolder>(CommentDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_comment, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val comment = getItem(position)
        holder.bind(comment)
    }

    inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val authorView: TextView = itemView.findViewById(R.id.tv_comment_author)
        private val dateView: TextView = itemView.findViewById(R.id.tv_comment_date)
        private val contentView: TextView = itemView.findViewById(R.id.tv_comment_content)
        private val likeButton: ImageButton = itemView.findViewById(R.id.btn_like_comment_icon)
        private val likeCountView: TextView = itemView.findViewById(R.id.tv_comment_like_count)
        // private val commenterProfileImage: ImageView = itemView.findViewById(R.id.iv_commenter_profile) // If you have it

        fun bind(comment: ForumComment) {
            val authorName = comment.author?.let { "${it.firstName ?: ""} ${it.lastName ?: ""}".trim() }
                ?: comment.author?.username
                ?: "User"
            authorView.text = authorName
            contentView.text = comment.content

            comment.createdAt?.let {
                try {
                    val formatter = DateTimeFormatter.ofLocalizedDateTime(FormatStyle.SHORT)
                        .withLocale(Locale.getDefault())
                    dateView.text = it.format(formatter)
                } catch (e: Exception) {
                    dateView.text = "Invalid date"
                }
            } ?: run {
                dateView.text = "Unknown date"
            }

            likeCountView.text = comment.actualLikesCount.toString()

            // Determine if the current user liked this comment
            val isLikedByCurrentUser = comment.likes?.any { it.id == currentUserId } == true

            if (isLikedByCurrentUser) {
                likeButton.imageTintList = ColorStateList.valueOf(ContextCompat.getColor(itemView.context, R.color.maroon))
            } else {
                likeButton.imageTintList = ColorStateList.valueOf(ContextCompat.getColor(itemView.context, R.color.text_secondary))
            }

            likeButton.setOnClickListener {
                onLikeClicked(comment) // Pass the specific comment
            }

            // Load commenter profile image using Glide if available
            // comment.author?.profileImage?.let { imageUrl ->
            //    Glide.with(itemView.context).load(imageUrl).placeholder(R.drawable.default_profile_icon).into(commenterProfileImage)
            // } ?: Glide.with(itemView.context).load(R.drawable.default_profile_icon).into(commenterProfileImage)
        }
    }

    class CommentDiffCallback : DiffUtil.ItemCallback<ForumComment>() {
        override fun areItemsTheSame(oldItem: ForumComment, newItem: ForumComment): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: ForumComment, newItem: ForumComment): Boolean {
            // Include isLikedByCurrentUser in content comparison if it can change without the object ref changing
            return oldItem == newItem && oldItem.isLikedByCurrentUser == newItem.isLikedByCurrentUser
        }
    }
}