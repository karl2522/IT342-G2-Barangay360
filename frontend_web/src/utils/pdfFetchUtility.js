/**
 * Utility functions for fetching and handling PDF documents
 * This provides a reliable way to fetch PDFs with multiple fallback options
 */

/**
 * Fetch a PDF document with robustness against network issues
 * @param {string} url - The URL to fetch the PDF from
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Blob>} - A promise resolving to a PDF blob
 */
export const fetchPDFWithRetry = async (url, options = {}) => {
  // Add cache busting to prevent 304 Not Modified responses
  const cacheBustUrl = addCacheBusting(url);
  
  // Add default headers for cache control
  const headers = {
    ...options.headers,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
  
  // Number of retry attempts
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let lastError = null;
  
  // Attempt to fetch with retries
  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`Attempt ${retryCount + 1} to fetch PDF from ${cacheBustUrl.slice(0, 50)}...`);
      
      // Try using the proxy approach for CORS issues
      const proxyUrl = getProxyUrl(cacheBustUrl);
      console.log(`Using URL: ${proxyUrl}`);
      
      const response = await fetch(proxyUrl, { 
        ...options,
        headers,
        credentials: 'include',
        cache: 'no-store',
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }
      
      // If successful, return the blob
      const blob = await response.blob();
      console.log(`Successfully fetched PDF (${blob.size} bytes)`);
      return blob;
    } catch (error) {
      console.error(`Attempt ${retryCount + 1} failed:`, error);
      lastError = error;
      retryCount++;
      
      // Short delay before retry
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // If we get here, all retry attempts have failed
  console.error(`All ${MAX_RETRIES} attempts to fetch PDF failed`);
  throw lastError || new Error('Failed to fetch PDF after multiple attempts');
};

/**
 * Creates a proxy URL to handle CORS issues
 * @param {string} originalUrl - The original URL to access
 * @returns {string} - A URL that can bypass CORS issues
 */
export const getProxyUrl = (originalUrl) => {
  // If the URL is already a blob or data URL, return it as is
  if (originalUrl.startsWith('blob:') || originalUrl.startsWith('data:')) {
    return originalUrl;
  }
  
  // Check if the API URL includes our backend domain
  if (originalUrl.includes('https://barangay360-nja7q.ondigitalocean.app/api')) {
    // Use a relative URL approach to avoid CORS
    // This works if properly configured in vite.config.js
    return originalUrl.replace('https://barangay360-nja7q.ondigitalocean.app/api', '/api');
  }
  
  return originalUrl;
};

/**
 * Add cache busting parameters to a URL
 * @param {string} url - The URL to add cache busting to
 * @returns {string} - URL with cache busting parameters
 */
export const addCacheBusting = (url) => {
  const timestamp = Date.now();
  const connector = url.includes('?') ? '&' : '?';
  return `${url}${connector}_cb=${timestamp}`;
};

/**
 * Create a fallback PDF for testing/development
 * @returns {Blob} - A multi-page PDF blob with content
 */
export const createFallbackPdf = async () => {
  // First try to load a sample document from public directory
  try {
    const response = await fetch('/sample-document.pdf', { cache: 'no-store' });
    if (response.ok) {
      return response.blob();
    }
  } catch (err) {
    console.warn('Failed to load fallback PDF from public directory', err);
  }
  
  // Base64 encoded simple multi-page PDF as last resort
  const pdfBase64 = "JVBERi0xLjcKJeTjz9IKCjEgMCBvYmoKPDwgL1R5cGUgL0NhdGFsb2cgL1BhZ2VzIDIgMCBSID4+CmVuZG9iagoKMiAwIG9iago8PCAvVHlwZSAvUGFnZXMgL0tpZHMgWzMgMCBSIDQgMCBSIDUgMCBSXSAvQ291bnQgMyA+PgplbmRvYmoKCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UKICAgL1BhcmVudCAyIDAgUgogICAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA2IDAgUiA+PiAvUHJvY1NldCBbL1BERiAvVGV4dF0gPj4gL01lZGlhQm94IFswIDAgNjEyLjAwMCA3OTIuMDAwXQogICAvQ29udGVudHMgNyAwIFIKPj4KZW5kb2JqCgo0IDAgb2JqCjw8IC9UeXBlIC9QYWdlCiAgIC9QYXJlbnQgMiAwIFIKICAgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNiAwIFIgPj4gL1Byb2NTZXQgWy9QREYgL1RleHRdID4+CiAgIC9NZWRpYUJveCBbMCAwIDYxMi4wMDAgNzkyLjAwMF0KICAgL0NvbnRlbnRzIDggMCBSCj4+CmVuZG9iagoKNSAwIG9iago8PCAvVHlwZSAvUGFnZQogICAvUGFyZW50IDIgMCBSCiAgIC9SZXNvdXJjZXMgPDwgL0ZvbnQgPDwgL0YxIDYgMCBSID4+IC9Qcm9jU2V0IFsvUERGIC9UZXh0XSA+PgogICAvTWVkaWFCb3ggWzAgMCA2MTIuMDAwIDc5Mi4wMDBdCiAgIC9Db250ZW50cyA5IDAgUgo+PgplbmRvYmoKCjYgMCBvYmoKPDwgL1R5cGUgL0ZvbnQKICAgL1N1YnR5cGUgL1R5cGUxCiAgIC9CYXNlRm9udCAvSGVsdmV0aWNhCiAgIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCj4+CmVuZG9iagoKNyAwIG9iaiAgICUgcGFnZSBjb250ZW50Cjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxOCBUZgoyNTAgMzgwIFRkCihEb2N1bWVudCBQcmV2aWV3IC0gUGFnZSAxKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCgo4IDAgb2JqICAgJSBwYWdlIGNvbnRlbnQKPDwKL0xlbmd0aCA0NAo+PgpzdHJlYW0KQlQKL0YxIDE4IFRmCjI1MCAzODAgVGQKKERvY3VtZW50IFByZXZpZXcgLSBQYWdlIDIpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKCjkgMCBvYmogICAlIHBhZ2UgY29udGVudAo8PAovTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVAovRjEgMTggVGYKMjUwIDM4MCBUZAooRG9jdW1lbnQgUHJldmlldyAtIFBhZ2UgMykgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKMTAgMCBvYmoKPDwgL1R5cGUgL0ZvbnREZXNjcmlwdG9yCiAgICAvRm9udE5hbWUgL0hlbHZldGljYQogICAgL0ZsYWdzIDMyCiAgICAvRm9udEJCb3ggWzAgMCA1MDAgNzAwXQogICAgL0l0YWxpY0FuZ2xlIDAKICAgIC9Bc2NlbnQgNzAwCiAgICAvRGVzY2VudCAtMjEwCiAgICAvQ2FwSGVpZ2h0IDcwMAogICAgL1N0ZW1WIDE0MAo+PgplbmRvYmoKCnhyZWYKMCAxMQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2OCAwMDAwMCBuIAowMDAwMDAwMTM5IDAwMDAwIG4gCjAwMDAwMDAzMDQgMDAwMDAgbiAKMDAwMDAwMDQ2OSAwMDAwMCBuIAowMDAwMDAwNjM0IDAwMDAwIG4gCjAwMDAwMDA3MzEgMDAwMDAgbiAKMDAwMDAwMDgzMyAwMDAwMCBuIAowMDAwMDAwOTM1IDAwMDAwIG4gCjAwMDAwMDEwMzcgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSAxMSAvUm9vdCAxIDAgUiAvSW5mbyAxMCAwIFIgPj4Kc3RhcnR4cmVmCjEyMDgKJSVFT0YK";
  
  // Convert base64 to binary array
  const binaryString = atob(pdfBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return new Blob([bytes.buffer], { type: 'application/pdf' });
};

/**
 * Safely get a PDF URL with fallbacks to ensure the viewer always has something to display
 * @param {string} url - The primary URL to fetch the PDF from
 * @returns {Promise<string>} - A blob URL to the PDF content
 */
export const getReliablePdfUrl = async (url) => {
  try {
    // Try to fetch with our robust method
    const blob = await fetchPDFWithRetry(url);
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Failed to fetch PDF, using fallback:', error);
    
    // Create a fallback PDF
    const fallbackBlob = await createFallbackPdf();
    return URL.createObjectURL(fallbackBlob);
  }
}; 