import React from 'react';

/**
 * A collection of utility functions for document handling
 */

/**
 * Processes PDF URL to create a reliable document URL with retry logic and fallbacks
 * @param {string} url - The URL of the document to process
 * @param {Object} options - Optional configuration
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 2)
 * @param {boolean} options.useFallback - Whether to use fallback for failed requests (default: true)
 * @param {Object} options.headers - Custom headers to include in the request
 * @returns {Promise<string>} - A URL that can be used to display the document
 */
export const processPdfUrl = async (url, options = {}) => {
  const { maxRetries = 2, useFallback = true, headers = {} } = options;
  let token = localStorage.getItem('token');
  
  // If custom authorization header is provided, use that instead
  if (headers.Authorization) {
    token = headers.Authorization.replace('Bearer ', '');
  }
  
  let attempts = 0;
  let lastError = null;
  
  // Add cache-busting parameter if not already present
  const urlWithCache = url.includes('?') 
    ? `${url}&_cb=${Date.now()}` 
    : `${url}?_cb=${Date.now()}`;
  
  // Attempt to fetch the document with retries
  while (attempts <= maxRetries) {
    try {
      console.log(`Attempt ${attempts + 1} to fetch document from: ${urlWithCache}`);
      
      // Combine default headers with custom headers
      const requestHeaders = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...headers
      };
      
      const response = await fetch(urlWithCache, {
        method: 'GET',
        headers: requestHeaders,
        credentials: 'include',
        mode: 'cors',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      // Create a blob URL from the response
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      console.log('Successfully created blob URL for document');
      return blobUrl;
      
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempts + 1} failed:`, error);
      attempts++;
      
      if (attempts <= maxRetries) {
        // Wait before retrying, using exponential backoff
        const delay = Math.pow(2, attempts) * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All attempts failed, use fallback if enabled
  if (useFallback) {
    console.log('Using fallback document mechanism');
    return createFallbackDocumentUrl();
  }
  
  throw new Error(`Failed to load document after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`);
};

/**
 * Creates a fallback document URL when the original document can't be loaded
 * @returns {Promise<string>} - A URL for a simple fallback document
 */
export const createFallbackDocumentUrl = async () => {
  try {
    // Try to load a local fallback file
    const fallbackPaths = [
      '/fallback-document.pdf',
      '/sample-document.pdf',
      '/assets/fallback.pdf'
    ];
    
    for (const path of fallbackPaths) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          const blob = await response.blob();
          return URL.createObjectURL(blob);
        }
      } catch (e) {
        console.warn(`Failed to load fallback from ${path}`, e);
      }
    }
    
    // If all fallbacks fail, create a simple PDF using data URL
    // This is a minimal PDF with "Document Unavailable" text
    return 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFsgMyAwIFIgXSAvQ291bnQgMSA+PgplbmRvYmoKMyAwIG9iago8PCAvVHlwZSAvUGFnZSAvTWVkaWFCb3ggWyAwIDAgNDAwIDIwMCBdIC9QYXJlbnQgMiAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNCAwIFIgPj4gPj4gL0NvbnRlbnRzIDUgMCBSID4+CmVuZG9iago0IDAgb2JqCjw8IC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL0hlbHZldGljYSA+PgplbmRvYmoKNSAwIG9iago8PCAvTGVuZ3RoIDEyOCAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeJxFj8EKwjAQRO/5irm2h2Td7CamoAdRKHgovYtJaA1toraJgn/vVsSD7mGYeTAQj6J7iAZk4JxJ6BPNSLZNSS4o6UFyFkOdLnAuS+sZQ+jmcT2Dgf+A5Qgj93hP3eKM5ZiYXRnsPWFCyX5EWelYJo6cW0rTPHtrm54SVQlRgbzD5v76fWJe5rgzn2fV9j+Vkz0ZHhBtyKHIplGpRKXnsnGbQS/rvFNZzw5b+ATcTkN5CmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjMgMDAwMDAgbiAKMDAwMDAwMDEyMiAwMDAwMCBuIAowMDAwMDAwMjU0IDAwMDAwIG4gCjAwMDAwMDAzMjEgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA2IC9Sb290IDEgMCBSIC9JbmZvIDYgMCBSID4+CnN0YXJ0eHJlZgo1MzIKJSVFT0YK';
    
  } catch (error) {
    console.error('Error creating fallback document URL:', error);
    // Return a minuscule placeholder PDF as last resort
    return 'data:application/pdf;base64,JVBERi0xLjAKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAxMDAgMTAwXSAvQ29udGVudHMgNCAwIFIgPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA4ID4+CnN0cmVhbQogICAgICAKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDY0IDAwMDAwIG4KMDAwMDAwMDEyMyAwMDAwMCBuIAowMDAwMDAwMjEwIDAwMDAwIG4KdHJhaWxlcgo8PCAvU2l6ZSA1IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgoyNjUKJSVFT0Y=';
  }
};

/**
 * Converts a document of any supported type to a Blob object
 * @param {string|Blob|File} document - The document to convert
 * @returns {Promise<Blob>} - The document as a Blob
 */
export const convertToBlob = async (document) => {
  // If already a blob, return it
  if (document instanceof Blob) {
    return document;
  }
  
  // If it's a string URL
  if (typeof document === 'string') {
    // If it's a data URL, convert it directly
    if (document.startsWith('data:')) {
      const parts = document.split(',');
      const mimeMatch = parts[0].match(/data:(.*?);base64/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const decodedData = atob(parts[1]);
      const uintArray = new Uint8Array(decodedData.length);
      
      for (let i = 0; i < decodedData.length; ++i) {
        uintArray[i] = decodedData.charCodeAt(i);
      }
      
      return new Blob([uintArray], { type: mime });
    }
    
    // Otherwise, fetch the URL
    const response = await fetch(document);
    return await response.blob();
  }
  
  // Handle ArrayBuffer or similar
  if (document instanceof ArrayBuffer) {
    return new Blob([document], { type: 'application/octet-stream' });
  }
  
  throw new Error('Unsupported document format');
};

/**
 * Creates a safe document viewer element using the best available method for the current environment
 * @param {string} documentUrl - The URL of the document to display
 * @param {string} mimeType - The MIME type of the document (defaults to application/pdf)
 * @returns {React.ReactElement} - A React element for viewing the document
 */
export const createDocumentViewer = (documentUrl, mimeType = 'application/pdf') => {
  if (!documentUrl) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-100 p-4">
        <p className="text-gray-600">No document URL provided</p>
      </div>
    );
  }

  // Use a combination of iframe and object/embed for maximum compatibility
  return (
    <div className="w-full h-full relative">
      {/* Primary viewer - iframe for most browsers */}
      <iframe
        src={`${documentUrl}#toolbar=0&navpanes=0`}
        className="w-full h-full border-0 absolute inset-0 z-10"
        title="Document Viewer"
        sandbox="allow-scripts allow-same-origin"
        loading="lazy"
      />
      
      {/* Fallback for browsers where iframe doesn't work well */}
      <object
        data={documentUrl}
        type={mimeType}
        className="w-full h-full border-0 absolute inset-0 z-0"
      >
        <embed 
          src={documentUrl} 
          type={mimeType}
          className="w-full h-full" 
        />
        <p className="p-4 bg-gray-100 border text-center">
          Unable to display document. <a href={documentUrl} download className="text-blue-600 underline">Download instead</a>
        </p>
      </object>
    </div>
  );
}; 