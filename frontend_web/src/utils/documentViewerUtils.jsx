/**
 * Utility functions for document viewing, with special handling for browser compatibility
 * and Microsoft Edge security restrictions
 */

/**
 * Check if the current browser is Microsoft Edge
 * @returns {boolean} - True if running in Edge, false otherwise
 */
export const isEdgeBrowser = () => {
  return navigator.userAgent.indexOf("Edg") !== -1;
};

/**
 * Creates a safe URL for document viewing that works across browsers
 * @param {string|Blob} document - The document URL or blob to create a viewer URL for
 * @param {string} token - Auth token to include in URL if needed
 * @returns {Promise<string>} - A URL that can be used in the document viewer
 */
export const createViewerUrl = async (document, token = null) => {
  try {
    // If it's already a blob URL, just return it
    if (typeof document === 'string' && document.startsWith('blob:')) {
      return document;
    }
    
    // If it's a blob, create a URL for it
    if (document instanceof Blob) {
      return URL.createObjectURL(document);
    }
    
    // If it's a string URL with the API endpoint
    if (typeof document === 'string') {
      // If using Edge, convert to blob first for added security
      if (isEdgeBrowser()) {
        try {
          // For Edge, fetch the document and create a blob URL
          // This helps bypass some content restrictions
          const response = await fetch(document, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
            credentials: 'include',
            mode: 'cors'
          });
          
          if (response.ok) {
            const blob = await response.blob();
            return URL.createObjectURL(blob);
          } else {
            console.warn(`Failed to fetch document: ${response.status}`);
            // Fall back to direct URL
            return appendTokenToUrl(document, token);
          }
        } catch (error) {
          console.error('Error converting document to blob:', error);
          // Fall back to direct URL
          return appendTokenToUrl(document, token);
        }
      }
      
      // For other browsers, just use the URL with token if provided
      return appendTokenToUrl(document, token);
    }
    
    throw new Error('Unsupported document format');
  } catch (error) {
    console.error('Error creating viewer URL:', error);
    return null;
  }
};

/**
 * Append a token to a URL if provided
 * @param {string} url - The base URL
 * @param {string} token - The token to append
 * @returns {string} - The URL with token appended if provided
 */
const appendTokenToUrl = (url, token) => {
  if (!token) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
};

/**
 * Get the appropriate document viewer for the current browser
 * @param {string} url - The document URL
 * @returns {'iframe'|'object'|'direct'} - The best viewer type for the current browser
 */
export const getBestViewerType = (url) => {
  // Microsoft Edge often has issues with iframes for PDFs
  if (isEdgeBrowser()) {
    return 'object';
  }
  
  // For blob URLs, iframe works well in most browsers
  if (url && url.startsWith('blob:')) {
    return 'iframe';
  }
  
  // Default viewer mode
  return 'iframe';
};

/**
 * Create a fallback content message element
 * @param {string} url - The document URL for direct access
 * @param {Function} onClose - Function to close the viewer
 * @returns {JSX.Element} - React element for fallback content
 */
export const createFallbackContent = (url, onClose) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-100 p-6">
      <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Document Cannot Be Displayed</h3>
      <p className="text-gray-600 text-center mb-4">
        This document might be blocked by your browser's security settings. 
        You can try the following options:
      </p>
      <div className="flex flex-col space-y-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded text-center hover:bg-blue-700"
        >
          Open in New Tab
        </a>
        <a
          href={url}
          download="document.pdf"
          className="px-4 py-2 bg-green-600 text-white rounded text-center hover:bg-green-700"
        >
          Download Document
        </a>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded text-center hover:bg-gray-700"
          >
            Close Viewer
          </button>
        )}
      </div>
    </div>
  );
}; 