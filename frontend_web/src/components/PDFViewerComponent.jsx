import React, { useState, useEffect } from 'react';

/**
 * PDFViewerComponent - A component for viewing PDFs with fallback mechanisms for various browsers
 * including Microsoft Edge which may block certain iframe content
 */
const PDFViewerComponent = ({ url, title, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [urlType, setUrlType] = useState('iframe'); // iframe, object, or direct

  useEffect(() => {
    // Check if we're running in Edge
    const isEdge = navigator.userAgent.indexOf("Edg") !== -1;
    console.log(`Detected browser: ${isEdge ? 'Edge' : 'Other'}`);
    
    // For Edge, try the object/embed approach first
    if (isEdge) {
      setUrlType('object');
    }
    
    // Set a timeout to check if the document loaded properly
    const timeoutId = setTimeout(() => {
      const iframe = document.getElementById('pdf-iframe');
      if (iframe && (
        !iframe.contentDocument || 
        !iframe.contentWindow || 
        iframe.contentWindow.document.body.innerHTML === '')
      ) {
        console.log('PDF loading timeout - switching to alternative viewer');
        // If iframe failed, try object tag
        if (urlType === 'iframe') {
          setUrlType('object');
        } else if (urlType === 'object') {
          // If object tag also failed, offer direct link
          setUrlType('direct');
        }
      }
      
      setIsLoading(false);
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [url, urlType]);

  const handleLoadError = () => {
    console.error('Failed to load PDF in current viewer mode');
    setError('Failed to load document in current mode');
    
    // Try next viewing method
    if (urlType === 'iframe') {
      setUrlType('object');
    } else if (urlType === 'object') {
      setUrlType('direct');
    }
  };

  const handleLoadSuccess = () => {
    console.log('PDF loaded successfully');
    setIsLoading(false);
    setError(null);
  };

  const renderViewer = () => {
    switch (urlType) {
      case 'iframe':
        return (
          <iframe
            id="pdf-iframe"
            src={url}
            className="w-full h-full border-0"
            title={title || "PDF Viewer"}
            sandbox="allow-scripts allow-same-origin"
            onLoad={handleLoadSuccess}
            onError={handleLoadError}
          />
        );
      
      case 'object':
        return (
          <object
            data={url}
            type="application/pdf"
            className="w-full h-full"
            onLoad={handleLoadSuccess}
            onError={handleLoadError}
          >
            <embed 
              src={url} 
              type="application/pdf"
              className="w-full h-full"
            />
            <p className="p-4 text-center bg-gray-100">
              Unable to display PDF. Please <button onClick={() => setUrlType('direct')} className="text-blue-600 underline">open directly</button>.
            </p>
          </object>
        );
      
      case 'direct':
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gray-100 p-6">
            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Open Document Externally</h3>
            <p className="text-gray-600 text-center mb-4">
              Your browser is blocking the document viewer. Please use one of these options:
            </p>
            <div className="flex flex-col space-y-2">
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
              >
                Open in New Tab
              </a>
              <a 
                href={url} 
                download
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center"
              >
                Download Document
              </a>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-full p-4 bg-gray-100">
            <p className="text-red-600">Invalid viewer type</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
        <h2 className="text-lg font-medium truncate">{title || 'Document Viewer'}</h2>
        <div className="flex items-center space-x-2">
          {/* Viewer type switcher */}
          <div className="flex items-center space-x-2 mr-4">
            <button
              onClick={() => setUrlType('iframe')}
              className={`px-2 py-1 text-xs rounded ${urlType === 'iframe' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Iframe
            </button>
            <button
              onClick={() => setUrlType('object')}
              className={`px-2 py-1 text-xs rounded ${urlType === 'object' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Object
            </button>
            <button
              onClick={() => setUrlType('direct')}
              className={`px-2 py-1 text-xs rounded ${urlType === 'direct' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Direct
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-200 hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-white relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              <p className="mt-3 text-gray-700">Loading document...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute top-0 left-0 right-0 bg-red-100 text-red-800 p-2 text-center">
            {error}
          </div>
        )}
        
        <div className="w-full h-full">
          {renderViewer()}
        </div>
      </div>
    </div>
  );
};

export default PDFViewerComponent; 