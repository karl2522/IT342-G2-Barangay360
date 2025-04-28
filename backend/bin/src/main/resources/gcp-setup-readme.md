# Google Cloud Storage Setup Guide

This guide will help you set up Google Cloud Storage for your Barangay360 application.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on "Select a project" at the top of the page, then click "New Project"
3. Enter a project name and click "Create"

## Step 2: Enable the Cloud Storage API

1. In your new project, go to "APIs & Services" > "Library"
2. Search for "Cloud Storage API" and click on it
3. Click "Enable"

## Step 3: Create a Storage Bucket

1. Go to "Cloud Storage" > "Buckets"
2. Click "Create Bucket"
3. Enter a unique bucket name
4. Choose your bucket location settings
5. Set access control to "Fine-grained" (recommended for more control)
6. Configure other settings as needed
7. Click "Create"

## Step 4: Set Up Bucket Permissions

1. Go to your bucket and click on the "Permissions" tab
2. Click "Add members"
3. Add "allUsers" with the "Storage Object Viewer" role if you want your images to be publicly accessible
4. Click "Save"

## Step 5: Create a Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Enter a name and description for your service account
4. Click "Create and Continue"
5. Add the "Storage Admin" role
6. Click "Continue" and then "Done"

## Step 6: Generate a Service Account Key

1. Find your service account in the list and click on it
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Click "Create"
6. The key file will be downloaded to your computer

## Step 7: Add the Key to Your Project

1. Rename the downloaded key file to `gcp-credentials.json`
2. Move the file to the `src/main/resources` directory in your project

## Step 8: Update Application Properties

Update the `application.properties` file with your Google Cloud project information:

```properties
# Google Cloud Storage Configuration
gcp.storage.bucket-name=your-bucket-name
gcp.storage.project-id=your-project-id
gcp.storage.credentials-path=classpath:gcp-credentials.json
gcp.storage.upload-dir=images/
```

Replace `your-bucket-name` with your actual bucket name and `your-project-id` with your Google Cloud project ID.

## Using the API

Once set up, you can use the following endpoints:

1. Upload a file:
   ```
   POST /api/files/upload
   Content-Type: multipart/form-data
   
   file: [your image file]
   prefix: [optional directory prefix]
   ```

2. Delete a file:
   ```
   DELETE /api/files/delete?fileUrl=https://storage.googleapis.com/your-bucket-name/path/to/file.jpg
   ```

3. List files:
   ```
   GET /api/files/list?prefix=optional/directory
   ```

All endpoints require authentication. 