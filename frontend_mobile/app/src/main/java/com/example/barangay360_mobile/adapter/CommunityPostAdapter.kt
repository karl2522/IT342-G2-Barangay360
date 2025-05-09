package com.example.barangay360_mobile.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.example.barangay360_mobile.R
import com.example.barangay360_mobile.api.models.CommunityPostResponse
// Import Glide or Picasso if you plan to load user profile images
// import com.bumptech.glide.Glide
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

class CommunityPostAdapter(
    private val onItemClicked: (CommunityPostResponse) -> Unit,
    private val onLikeClicked: (CommunityPostResponse) -> Unit,
    private val onCommentClicked: (CommunityPostResponse) -> Unit,
//    private val onShareClicked: (CommunityPostResponse) -> Unit
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
        private val likeCountView: TextView = itemView.findViewById(R.id.like_count)
        private val commentCountView: TextView = itemView.findViewById(R.id.comment_count)
//        private val btnLike: Button = itemView.findViewById(R.id.btn_like)
//        private val btnComment: Button = itemView.findViewById(R.id.btn_comment)
//        private val btnShare: Button = itemView.findViewById(R.id.btn_share)
        private val btnLikeIcon: ImageButton = itemView.findViewById(R.id.btn_like_icon)
        private val btnCommentIcon: ImageButton = itemView.findViewById(R.id.btn_comment_icon)
        private val postImageView: ImageView = itemView.findViewById(R.id.iv_post_image)



        // Assuming you might add an ImageView for the user's profile picture in item_community.xml
        // private val userProfileImageView: ImageView = itemView.findViewById(R.id.iv_user_profile_image)
        // Assuming you might add an ImageView for the post's image in item_community.xml
        // private val postImageView: ImageView = itemView.findViewById(R.id.iv_post_image)


        fun bind(post: CommunityPostResponse) {
            val authorName = post.author?.let { "${it.firstName ?: ""} ${it.lastName ?: ""}".trim() }
                ?: post.author?.username
                ?: "Anonymous"
            userNameView.text = authorName
            titleView.text = post.title ?: "No Title"
            descriptionView.text = post.content ?: "No content" // Changed from post.description

            val displayDate = post.updatedAt ?: post.createdAt // Prefer updatedAt if available
            displayDate?.let {
                try {
                    // More flexible date formatting
                    val formatter = DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM)
                        .withLocale(Locale.getDefault())
                    postDateView.text = "Posted: ${it.format(formatter)}"
                } catch (e: Exception) {
                    postDateView.text = "Date unavailable" // Fallback
                }
            } ?: run {
                postDateView.text = "Date unavailable"
            }
            likeCountView.text = "${post.likes?.size ?: 0} likes"
            commentCountView.text = "${post.comments?.size ?: 0} comments"
            post.imageUrl?.let { url ->
                postImageView.visibility = View.VISIBLE
                Glide.with(itemView.context).load(url).into(postImageView)
            } ?: run {
                postImageView.visibility = View.GONE
            }


            // Example for loading author profile image (if you add an ImageView with id 'iv_user_profile_image')
            // post.author?.profileImage?.let { url ->
            //     Glide.with(itemView.context)
            //         .load(url)
            //         .placeholder(R.drawable.default_profile_icon) // your placeholder
            //         .error(R.drawable.default_profile_icon) // your error placeholder
            //         .into(userProfileImageView)
            // } ?: userProfileImageView.setImageResource(R.drawable.default_profile_icon)




            itemView.setOnClickListener {
                onItemClicked(post)
            }
//            btnLike.setOnClickListener {
//                onLikeClicked(post)
//                Toast.makeText(itemView.context, "Like clicked for: ${post.title}", Toast.LENGTH_SHORT).show()
//            }
//            btnComment.setOnClickListener {
//                onCommentClicked(post)
//                Toast.makeText(itemView.context, "Comment clicked for: ${post.title}", Toast.LENGTH_SHORT).show()
//            }
//            btnShare.setOnClickListener {
//                onShareClicked(post)
//                Toast.makeText(itemView.context, "Share clicked for: ${post.title}", Toast.LENGTH_SHORT).show()
//            }
            btnLikeIcon.setOnClickListener {
                onLikeClicked(post)
                // Toggle icon state if you want (e.g., filled thumb vs. outline)
                // For example, change tint or icon resource based on like state
                // (this would require tracking the like state in your post model)
                // btnLikeIcon.setColorFilter(ContextCompat.getColor(itemView.context, R.color.maroon)) // Example
                Toast.makeText(itemView.context, "Like icon clicked for: ${post.title}", Toast.LENGTH_SHORT).show()
            }
            btnCommentIcon.setOnClickListener {
                onCommentClicked(post)
                Toast.makeText(itemView.context, "Comment icon clicked for: ${post.title}", Toast.LENGTH_SHORT).show()
            }
//            btnShareIcon.setOnClickListener {
//                onShareClicked(post)
//                Toast.makeText(itemView.context, "Share icon clicked for: ${post.title}", Toast.LENGTH_SHORT).show()
//            }
        }
    }
}

// CommunityPostDiffCallback remains the same
class CommunityPostDiffCallback : DiffUtil.ItemCallback<CommunityPostResponse>() {
    override fun areItemsTheSame(oldItem: CommunityPostResponse, newItem: CommunityPostResponse): Boolean {
        return oldItem.id == newItem.id
    }

    override fun areContentsTheSame(oldItem: CommunityPostResponse, newItem: CommunityPostResponse): Boolean {
        return oldItem == newItem
    }
}