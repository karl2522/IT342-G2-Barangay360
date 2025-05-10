package com.example.barangay360_mobile

import android.Manifest
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.DialogInterface
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.bumptech.glide.Glide // For loading preview
import com.example.barangay360_mobile.api.ApiClient
import com.example.barangay360_mobile.databinding.FragmentCreatePostBinding
import com.example.barangay360_mobile.util.SessionManager
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class CreatePostFragment : Fragment() {

    private var _binding: FragmentCreatePostBinding? = null
    private val binding get() = _binding!!

    private lateinit var sessionManager: SessionManager
    private var selectedImageUri: Uri? = null // URI of the image selected from gallery or taken by camera
    private var cameraImageUri: Uri? = null    // Specifically for storing the URI provided to the camera intent

    // Permission launchers
    private lateinit var requestCameraPermissionLauncher: ActivityResultLauncher<String>
    private lateinit var requestStoragePermissionLauncher: ActivityResultLauncher<String>
    private lateinit var requestReadMediaImagesPermissionLauncher: ActivityResultLauncher<String>

    // Activity result launchers for image picking/taking
    private lateinit var pickImageFromGalleryLauncher: ActivityResultLauncher<Intent>
    private lateinit var takePictureLauncher: ActivityResultLauncher<Uri>


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        initializePermissionLaunchers()
        initializeActivityResulLaunchers()
    }

    private fun initializePermissionLaunchers() {
        requestCameraPermissionLauncher =
            registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
                if (isGranted) {
                    openCamera()
                } else {
                    Toast.makeText(context, "Camera permission denied", Toast.LENGTH_SHORT).show()
                }
            }

        requestReadMediaImagesPermissionLauncher =
            registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
                if (isGranted) {
                    openGallery()
                } else {
                    Toast.makeText(context, "Storage permission denied", Toast.LENGTH_SHORT).show()
                }
            }

        requestStoragePermissionLauncher =
            registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
                if (isGranted) {
                    openGallery()
                } else {
                    Toast.makeText(context, "Storage permission denied", Toast.LENGTH_SHORT).show()
                }
            }
    }

    private fun initializeActivityResulLaunchers() {
        pickImageFromGalleryLauncher =
            registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
                if (result.resultCode == Activity.RESULT_OK) {
                    result.data?.data?.let { uri ->
                        selectedImageUri = uri // This is the URI for the chosen gallery image
                        cameraImageUri = null // Clear camera URI if gallery image is chosen
                        binding.ivSelectedImagePreview.visibility = View.VISIBLE
                        Glide.with(this).load(uri).into(binding.ivSelectedImagePreview)
                        Log.d("CreatePostFragment", "Image selected from gallery: $uri")
                    }
                }
            }

        takePictureLauncher =
            registerForActivityResult(ActivityResultContracts.TakePicture()) { success ->
                if (success) {
                    // The image is now at cameraImageUri
                    val localCameraUri = this.cameraImageUri // Capture to local val
                    if (localCameraUri != null) {
                        selectedImageUri = localCameraUri // Use the URI where the full-size image was stored
                        binding.ivSelectedImagePreview.visibility = View.VISIBLE
                        Glide.with(this).load(localCameraUri).into(binding.ivSelectedImagePreview)
                        Log.d("CreatePostFragment", "Image captured by camera: $localCameraUri")
                    } else {
                        Log.e("CreatePostFragment", "Camera URI is null after successful capture.")
                        Toast.makeText(context, "Failed to retrieve camera image.", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    Log.e("CreatePostFragment", "Failed to capture image with camera.")
                    // Optionally delete the temp file if capture failed
                    this.cameraImageUri?.let { uri ->
                        try {
                            context?.contentResolver?.delete(uri, null, null)
                            Log.d("CreatePostFragment", "Deleted temp camera file due to capture failure: $uri")
                        } catch (e: Exception) {
                            Log.e("CreatePostFragment", "Error deleting temp camera file: $uri", e)
                        }
                    }
                    this.cameraImageUri = null // Reset it
                }
            }
    }


    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCreatePostBinding.inflate(inflater, container, false)
        sessionManager = SessionManager.getInstance()
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

//        binding.toolbarCreatePost.setNavigationOnClickListener {
//            findNavController().popBackStack()
//        }

        binding.btnAddImage.setOnClickListener {
            showImageSourceDialog()
        }

        // This argument handling can be removed if not used,
        // or if showImageSourceDialog() is always the desired action
        val shouldLaunchImagePicker = arguments?.getBoolean("launchImagePicker", false) ?: false
        if (shouldLaunchImagePicker && savedInstanceState == null) { // Check savedInstanceState to prevent re-triggering on config change
            showImageSourceDialog()
        }

        binding.btnSubmitPost.setOnClickListener {
            val title = binding.etPostTitle.text.toString().trim()
            val content = binding.etPostContent.text.toString().trim()

            if (content.isEmpty()) {
                binding.layoutPostContent.error = "Content cannot be empty"
                return@setOnClickListener
            } else {
                binding.layoutPostContent.error = null
            }
            submitPost(title, content)
        }
    }

    private fun showImageSourceDialog() {
        val options = arrayOf<CharSequence>("Take Photo", "Choose from Gallery", "Cancel")
        val builder = AlertDialog.Builder(requireContext())
        builder.setTitle("Add Photo")
        builder.setItems(options) { dialog: DialogInterface, item: Int ->
            when {
                options[item] == "Take Photo" -> checkCameraPermissionAndOpenCamera()
                options[item] == "Choose from Gallery" -> checkStoragePermissionAndOpenGallery()
                options[item] == "Cancel" -> dialog.dismiss()
            }
        }
        builder.show()
    }

    private fun checkCameraPermissionAndOpenCamera() {
        when {
            ContextCompat.checkSelfPermission(
                requireContext(),
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED -> {
                openCamera()
            }
            shouldShowRequestPermissionRationale(Manifest.permission.CAMERA) -> {
                AlertDialog.Builder(requireContext())
                    .setTitle("Camera Permission Needed")
                    .setMessage("This app needs the Camera permission to take photos for your posts.")
                    .setPositiveButton("OK") { _, _ ->
                        requestCameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                    }
                    .setNegativeButton("Cancel", null)
                    .show()
            }
            else -> {
                requestCameraPermissionLauncher.launch(Manifest.permission.CAMERA)
            }
        }
    }

    private fun checkStoragePermissionAndOpenGallery() {
        val permissionToRequest = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            Manifest.permission.READ_MEDIA_IMAGES
        } else {
            Manifest.permission.READ_EXTERNAL_STORAGE
        }

        when {
            ContextCompat.checkSelfPermission(
                requireContext(),
                permissionToRequest
            ) == PackageManager.PERMISSION_GRANTED -> {
                openGallery()
            }
            shouldShowRequestPermissionRationale(permissionToRequest) -> {
                AlertDialog.Builder(requireContext())
                    .setTitle("Storage Permission Needed")
                    .setMessage("This app needs permission to access your gallery to select photos for your posts.")
                    .setPositiveButton("OK") { _, _ ->
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                            requestReadMediaImagesPermissionLauncher.launch(permissionToRequest)
                        } else {
                            requestStoragePermissionLauncher.launch(permissionToRequest)
                        }
                    }
                    .setNegativeButton("Cancel", null)
                    .show()
            }
            else -> {
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                    requestReadMediaImagesPermissionLauncher.launch(permissionToRequest)
                } else {
                    requestStoragePermissionLauncher.launch(permissionToRequest)
                }
            }
        }
    }


    private fun openGallery() {
        val intent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
        // For more specific image types if needed: intent.type = "image/*"
        try {
            pickImageFromGalleryLauncher.launch(intent)
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(context, "No gallery app found.", Toast.LENGTH_SHORT).show()
        }
    }

    private fun openCamera() {
        try {
            val photoFile: File = createImageFile() // Create a file to store the image
            val authority = "${requireContext().packageName}.fileprovider"
            val localCameraImageUri = FileProvider.getUriForFile(
                requireContext(),
                authority, // This must match the authority in AndroidManifest.xml <provider>
                photoFile
            )
            this.cameraImageUri = localCameraImageUri // Store this URI to access the file later
            takePictureLauncher.launch(localCameraImageUri) // Pass the content URI to the camera app
        } catch (ex: IOException) {
            Log.e("CreatePostFragment", "Error creating image file for camera", ex)
            Toast.makeText(context, "Error preparing camera.", Toast.LENGTH_SHORT).show()
        }
    }

    @Throws(IOException::class)
    private fun createImageFile(): File {
        val timeStamp: String = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
        val imageFileName = "JPEG_${timeStamp}_"
        // Use app's cache directory for temporary camera images more reliably
        val storageDir: File = requireContext().cacheDir // More robust than getExternalFilesDir for temp files
        val imageSubDir = File(storageDir, "images")
        if (!imageSubDir.exists()) {
            imageSubDir.mkdirs()
        }
        return File.createTempFile(
            imageFileName,  /* prefix */
            ".jpg",         /* suffix */
            imageSubDir     /* directory */
        ).apply {
            Log.d("CreatePostFragment", "Temp camera file created: $absolutePath")
        }
    }


    // getFileFromUri remains crucial for handling URIs from both gallery and camera (FileProvider URI)
    private fun getFileFromUri(uri: Uri): File? {
        val context = requireContext()
        val contentResolver = context.contentResolver
        val timeStamp: String = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
        val fileName = "upload_image_${timeStamp}_${uri.lastPathSegment ?: "temp"}.jpg" // More unique name
        val destinationFile = File(context.cacheDir, fileName)

        try {
            val inputStream = contentResolver.openInputStream(uri) ?: run {
                Log.e("CreatePostFragment", "ContentResolver failed to open InputStream for URI: $uri")
                return null
            }
            val outputStream = FileOutputStream(destinationFile)
            inputStream.copyTo(outputStream)
            inputStream.close()
            outputStream.close()
            Log.d("CreatePostFragment", "File copied from URI to Cache: ${destinationFile.absolutePath}, Size: ${destinationFile.length()}")
            if (destinationFile.length() == 0L) {
                Log.e("CreatePostFragment", "Copied file is empty!")
                destinationFile.delete() // Clean up empty file
                return null
            }
            return destinationFile
        } catch (e: Exception) {
            Log.e("CreatePostFragment", "Error copying file from URI: $uri", e)
            destinationFile.delete() // Clean up if error
            return null
        }
    }


    private fun submitPost(title: String, content: String) {
        if (!sessionManager.isLoggedIn()) {
            Toast.makeText(context, "Please login to create a post.", Toast.LENGTH_SHORT).show()
            return
        }

        binding.progressBarCreatePost.visibility = View.VISIBLE
        binding.btnSubmitPost.isEnabled = false

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val titleRequestBody = title.toRequestBody("text/plain".toMediaTypeOrNull())
                val contentRequestBody = content.toRequestBody("text/plain".toMediaTypeOrNull())
                var imagePart: MultipartBody.Part? = null

                selectedImageUri?.let { uri -> // selectedImageUri is now correctly set by both gallery and camera
                    val file = getFileFromUri(uri)
                    if (file != null && file.exists() && file.length() > 0) {
                        Log.d("CreatePostFragment", "Preparing image for upload: ${file.name}, Size: ${file.length()}")
                        val requestFile = file.asRequestBody("image/*".toMediaTypeOrNull())
                        imagePart = MultipartBody.Part.createFormData("image", file.name, requestFile)
                    } else {
                        Log.e("CreatePostFragment", "File for upload is null, does not exist, or is empty. URI: $uri")
                        // Optionally inform the user that the image could not be processed
                        if (isAdded) Toast.makeText(context, "Could not process selected image.", Toast.LENGTH_SHORT).show()
                    }
                }

                val response = ApiClient.communityFeedService.createPost(
                    titleRequestBody,
                    contentRequestBody,
                    imagePart // Will be null if no image or if file processing failed
                )

                if (!isAdded) return@launch

                if (response.isSuccessful) {
                    Toast.makeText(context, "Post created successfully!", Toast.LENGTH_SHORT).show()
                    parentFragmentManager.setFragmentResult("postCreated", Bundle.EMPTY)
                    findNavController().popBackStack()
                } else {
                    val errorBody = response.errorBody()?.string() ?: "Unknown error"
                    Toast.makeText(context, "Failed to create post: ${response.code()} - $errorBody", Toast.LENGTH_LONG).show()
                    Log.e("CreatePostFragment", "API Error: ${response.code()} - $errorBody")
                }

            } catch (e: Exception) {
                if (isAdded) {
                    Toast.makeText(context, "Error creating post: ${e.message}", Toast.LENGTH_LONG).show()
                    Log.e("CreatePostFragment", "Exception: ${e.message}", e)
                }
            } finally {
                if (isAdded) {
                    binding.progressBarCreatePost.visibility = View.GONE
                    binding.btnSubmitPost.isEnabled = true
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}