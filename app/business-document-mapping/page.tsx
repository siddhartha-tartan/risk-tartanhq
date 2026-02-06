'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/legacy/image';
import { documentStore } from '@/utils/documentStore';
import { MockingStateManager } from '@/utils/mockingState';
import AppLayout from '@/app/components/AppLayout';

// File type to icon mapping
const fileTypeIcons = {
  pdf: '/icons/pdf-icon.png',
  jpg: '/icons/jpg-icon.png',
  jpeg: '/icons/jpg-icon.png',
  png: '/icons/png-icon.png',
  default: '/icons/document-icon.png',
};

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    </AppLayout>
  );
}

export default function BusinessDocumentMappingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BusinessDocumentMappingContent />
    </Suspense>
  );
}

function BusinessDocumentMappingContent() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check initial mock mode state
  useEffect(() => {
    setIsMockMode(MockingStateManager.isMockModeEnabled());
  }, []);

  useEffect(() => {
    // Get session ID from URL if available
    const urlSessionId = searchParams.get('s3Key');
    if (urlSessionId) {
      setSessionId(urlSessionId);
      console.log(`Found session ID in URL: ${urlSessionId}`);
    }
    
    // Get documents from the document store
    const storedDocuments = documentStore.getDocuments();
    
    if (storedDocuments.length === 0) {
      setError('No documents found. Please upload a zip file first.');
    } else {
      console.log('Documents loaded for business loan:', storedDocuments.length);
      
      // If we have a session ID from URL, filter documents by that session
      let sessionFilteredDocs = storedDocuments;
      if (urlSessionId) {
        console.log(`Filtering documents by session ID: ${urlSessionId}`);
        
        // Strict filtering - only include documents with a matching session ID
        sessionFilteredDocs = storedDocuments.filter(doc => 
          doc.userSession === urlSessionId
        );
        
        console.log(`After filtering: ${sessionFilteredDocs.length} documents match session ID`);
        
        // If no documents match the session, fall back to all documents but log warning
        if (sessionFilteredDocs.length === 0) {
          console.warn(`Warning: No documents match session ID ${urlSessionId}. Using all documents.`);
          sessionFilteredDocs = storedDocuments;
        }
      }
      
      // Sort documents by filename
      const sortedDocuments = [...sessionFilteredDocs].sort((a, b) => 
        a.originalFilename.localeCompare(b.originalFilename)
      );
      
      setDocuments(sortedDocuments);
    }
  }, [searchParams]);

  // Get current document
  const currentDocument = documents[currentDocIndex];

  useEffect(() => {
    if (currentDocument) {
      console.log('Current document:', currentDocument.originalFilename);
      console.log('OCR text available:', !!currentDocument.ocrText);
      if (currentDocument.ocrText) {
        console.log('OCR text length:', currentDocument.ocrText.length);
        console.log('OCR text preview:', currentDocument.ocrText.substring(0, 100) + '...');
      }
    }
  }, [currentDocIndex, currentDocument]);

  const handleDocumentChange = (index: number) => {
    setCurrentDocIndex(index);
  };

  const handleActivateDemoMode = () => {
    if (!isMockMode) {
      MockingStateManager.enableMockMode();
      setIsMockMode(true);
      console.log('🎭 Demo mode activated via heading click');
    }
  };

  const handleOcrTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentDocument) return;
    
    const updatedDocuments = [...documents];
    updatedDocuments[currentDocIndex].ocrText = event.target.value;
    setDocuments(updatedDocuments);
    
    // Update the document in the store
    documentStore.updateDocument(currentDocument.id, { ocrText: event.target.value });
  };

  const handleContinue = async () => {
    try {
      // Set processing state to true to show loading
      setIsProcessing(true);
      
      // Save all documents with their updated OCR text to the document store
      documents.forEach(doc => {
        documentStore.updateDocument(doc.id, { 
          ocrText: doc.ocrText
        });
      });
      
      // Make sure we have OCR text for all documents
      const docsWithOcr = documents.filter(doc => doc.ocrText && doc.ocrText.trim().length > 0);
      
      if (docsWithOcr.length === 0) {
        setError("No documents have OCR text available. Please make sure documents are properly processed.");
        setIsProcessing(false);
        return;
      }
      
      // Call the API to analyze business documents with LLM, using only the documents from the store
      // No need to reprocess the original ZIP file
      const response = await fetch('/api/process/analyze-business-documents', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...MockingStateManager.getMockHeaders()
        },
        body: JSON.stringify({ 
          documents: docsWithOcr.map(doc => ({
            id: doc.id,
            originalFilename: doc.originalFilename,
            ocrText: doc.ocrText
          }))
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze documents');
      }
      
      const result = await response.json();
      
      // Store the analysis results in the documentStore
      documentStore.setVerificationResults(result.analysisResult);
      console.log('Analysis results stored:', result.analysisResult);
      
      // Navigate to the output page
      router.push('/business-output');
    } catch (error: any) {
      console.error('Error during analysis:', error);
      setError(error.message || 'Failed to process documents');
      setIsProcessing(false);
    }
  };

  // Function to download document OCRs as JSON
  const handleDownloadJson = () => {
    if (documents.length === 0) return;
    
    // Create a JSON object with document names and OCR text
    const documentData = documents.map(doc => ({
      filename: doc.originalFilename,
      ocrText: doc.ocrText || '',
    }));
    
    // Create a Blob with the JSON data
    const jsonBlob = new Blob([JSON.stringify(documentData, null, 2)], { type: 'application/json' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(jsonBlob);
    
    // Create a temporary link element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `business-documents-ocr-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper function to get icon based on file extension
  const getDocumentIcon = (originalFilename: string) => {
    const extension = originalFilename.split('.').pop()?.toLowerCase();
    return fileTypeIcons[extension as keyof typeof fileTypeIcons] || fileTypeIcons.default;
  };

  if (error && documents.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center text-red-600 mb-4">{error}</div>
          <button
            onClick={() => router.push('/business-upload')}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Return to Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 
                className={`text-2xl font-bold cursor-pointer select-none transition-colors duration-200 ${
                  isMockMode 
                    ? 'text-gray-800 border-b-2 border-yellow-400 pb-1' 
                    : 'text-gray-900 hover:text-gray-700'
                }`}
                onClick={handleActivateDemoMode}
                title={isMockMode ? "Demo Mode Active" : "Click to activate demo mode"}
              >
                Business Document Review
              </h1>
              <p className="text-gray-600">Review extracted data from business loan documents</p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleDownloadJson}
                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center"
                disabled={isProcessing}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download JSON
            </button>
          </div>
        </div>
        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          
          {/* Document Navigator (Sidebar) */}
          <div className="flex h-[calc(100vh-220px)]">
            <div className="w-64 border-r border-gray-200 overflow-y-auto bg-gray-50">
              <div className="py-2 px-3 text-sm font-medium text-gray-700 border-b border-gray-200">
                All Documents
              </div>
              <ul>
                {documents.map((doc, index) => (
                  <li 
                    key={doc.id}
                    className={`px-3 py-2 flex items-center cursor-pointer ${
                      index === currentDocIndex ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleDocumentChange(index)}
                  >
                    <div className="flex-shrink-0 w-8 h-8 mr-3 flex items-center justify-center">
                      <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-sm font-medium ${
                        index === currentDocIndex ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        index === currentDocIndex ? 'text-indigo-700' : 'text-gray-700'
                      }`}>
                        {doc.originalFilename}
                      </p>
                      <div className="flex items-center">
                        <p className={`text-xs truncate ${
                          index === currentDocIndex ? 'text-indigo-500' : 'text-gray-500'
                        }`}>
                          {doc.ocrText ? 'OCR text available' : 'No OCR text'}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {currentDocument && (
                <>
                  {/* Document Name & OCR Text Edit */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                      {currentDocument.originalFilename}
                    </h2>
                  </div>
                  
                  {/* Document Preview & OCR Text (Side-by-side) */}
                  <div className="flex-1 flex overflow-hidden">
                    {/* Document Preview (Left side) */}
                    <div className="w-1/2 border-r border-gray-200 overflow-y-auto p-4 bg-gray-50">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Document Preview</h3>
                      <div className="bg-white rounded-md shadow-sm p-4 h-full flex items-center justify-center">
                        {currentDocument.originalFilename ? (
                          currentDocument.filetype === 'application/pdf' ? (
                            <iframe
                              src={`/api/documents/preview?filename=${encodeURIComponent(currentDocument.originalFilename)}`}
                              className="w-full h-full min-h-[400px]"
                              title={currentDocument.originalFilename}
                              onError={(e) => {
                                // Handle iframe load error
                                const target = e.target as HTMLIFrameElement;
                                target.style.display = 'none';
                                const errorContainer = target.parentElement;
                                if (errorContainer) {
                                  const errorMessage = document.createElement('div');
                                  errorMessage.className = "text-center p-4";
                                  errorMessage.innerHTML = `
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <p class="text-gray-600 mb-2">Preview not available</p>
                                    <p class="text-sm text-gray-500">The document may have been renamed or deleted.</p>
                                  `;
                                  errorContainer.appendChild(errorMessage);
                                }
                              }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <img
                                src={`/api/documents/preview?filename=${encodeURIComponent(currentDocument.originalFilename)}`}
                                alt={currentDocument.originalFilename}
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => {
                                  // Handle image load error
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const errorContainer = target.parentElement;
                                  if (errorContainer) {
                                    const errorMessage = document.createElement('div');
                                    errorMessage.className = "text-center p-4";
                                    errorMessage.innerHTML = `
                                      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                      </svg>
                                      <p class="text-gray-600 mb-2">Preview not available</p>
                                      <p class="text-sm text-gray-500">The document may have been renamed or deleted.</p>
                                    `;
                                    errorContainer.appendChild(errorMessage);
                                  }
                                }}
                              />
                            </div>
                          )
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <Image
                                src={getDocumentIcon(currentDocument.originalFilename)}
                                alt="Document Icon"
                                width={64}
                                height={64}
                                className="mx-auto mb-4"
                              />
                              <span className="text-gray-400">Preview not available</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* OCR Text (Right side) */}
                    <div className="w-1/2 overflow-y-auto p-4 bg-white">
                      <div className="mb-2 flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-700">OCR Text</h3>
                        <span className="text-xs text-gray-500">
                          {currentDocument.ocrText ? 
                            `${currentDocument.ocrText.length} characters` : 
                            'No OCR text'}
                        </span>
                      </div>
                      <textarea
                        className="w-full h-full min-h-[400px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                        value={currentDocument.ocrText || ''}
                        onChange={handleOcrTextChange}
                        placeholder="No OCR text is available for this document. You can enter text manually."
                      />
                    </div>
                  </div>
                </>
              )}
              
              {!currentDocument && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-gray-500 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>Select a document to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </AppLayout>
  );
} 