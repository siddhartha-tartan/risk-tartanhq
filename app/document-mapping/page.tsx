'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/legacy/image';
import { documentStore } from '@/utils/documentStore';
import { personalLoanDocumentTypes, getDocumentTypeName } from '@/models/DocumentTypes';
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

export default function DocumentMappingPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [error, setError] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationProgress, setClassificationProgress] = useState({
    completed: 0,
    total: 0,
    currentFile: '',
  });
  const [classificationDone, setClassificationDone] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);
  const router = useRouter();

  // Check initial mock mode state
  useEffect(() => {
    setIsMockMode(MockingStateManager.isMockModeEnabled());
  }, []);

  useEffect(() => {
    // Get documents from the document store
    const storedDocuments = documentStore.getDocuments();
    
    if (storedDocuments.length === 0) {
      setError('No documents found. Please upload a zip file first.');
    } else {
      console.log('Documents loaded from store:', storedDocuments.length);
      console.log('Documents with OCR text:', storedDocuments.filter(doc => 
        doc.ocrText && doc.ocrText.length > 0 && !doc.ocrText.startsWith('[No OCR')).length);
      
      // Log first few documents OCR status
      storedDocuments.slice(0, 3).forEach((doc, idx) => {
        console.log(`Document ${idx + 1}: ${doc.originalFilename}`);
        console.log(`  Has OCR text: ${doc.ocrText ? 'Yes' : 'No'}`);
        if (doc.ocrText) {
          console.log(`  OCR text length: ${doc.ocrText.length}`);
          console.log(`  OCR text preview: ${doc.ocrText.substring(0, 100)}...`);
        }
      });
      
      // Sort documents by filename
      const sortedDocuments = [...storedDocuments].sort((a, b) => 
        a.originalFilename.localeCompare(b.originalFilename)
      );
      
      setDocuments(sortedDocuments);
      
      // Start background classification
      startBackgroundClassification(sortedDocuments);
    }
  }, []);

  // Start background document classification
  const startBackgroundClassification = async (docs: any[]) => {
    if (!docs.length) return;
    
    setIsClassifying(true);
    setClassificationProgress({
      completed: 0,
      total: docs.length,
      currentFile: docs[0].originalFilename,
    });
    
    // Start classification in background
    try {
      // Process each document to classify it
      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        
        setClassificationProgress({
          completed: i,
          total: docs.length,
          currentFile: doc.originalFilename,
        });
        
        console.log(`Background classification: ${doc.originalFilename}`);
        
        // Classify document based on OCR text
        let classifiedType = 'other';
        
        if (doc.ocrText) {
          const ocrText = doc.ocrText.toLowerCase();
          
          if (ocrText.includes('aadhar') || ocrText.includes('आधार') || 
              ocrText.includes('unique identification') || doc.originalFilename.toLowerCase().includes('aadhar')) {
            classifiedType = 'identity_proof';
          } else if (ocrText.includes('salary') || ocrText.includes('pay slip') || 
                    doc.originalFilename.toLowerCase().includes('salary')) {
            classifiedType = 'income_proof';
          } else if (ocrText.includes('bank') || ocrText.includes('statement') ||
                    doc.originalFilename.toLowerCase().includes('bank')) {
            classifiedType = 'bank_statement';
          } else if (ocrText.includes('address') || ocrText.includes('पता') ||
                    doc.originalFilename.toLowerCase().includes('address')) {
            classifiedType = 'address_proof';
          }
        }
        
        // Update document with AI-assigned type
        documentStore.updateDocument(doc.id, { 
          aiClassifiedType: classifiedType,
          classificationConfidence: Math.random() * 0.3 + 0.7 // Random confidence between 70-100%
        });
        
        // Update local state to reflect classification
        const updatedDocs = [...docs];
        updatedDocs[i] = {
          ...updatedDocs[i],
          aiClassifiedType: classifiedType,
          classificationConfidence: Math.random() * 0.3 + 0.7
        };
        
        setDocuments(updatedDocs);
        
        // Simulate some processing time, but make it faster than the foreground process
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
      }
      
      // Update to show all documents are processed
      setClassificationProgress({
        completed: docs.length,
        total: docs.length,
        currentFile: '',
      });
      
      setClassificationDone(true);
    } catch (err) {
      console.error('Background classification error:', err);
    } finally {
      setIsClassifying(false);
    }
  };

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

  const handleOcrTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentDocument) return;
    
    const updatedDocuments = [...documents];
    updatedDocuments[currentDocIndex].ocrText = event.target.value;
    setDocuments(updatedDocuments);
    
    // Update the document in the store
    documentStore.updateDocument(currentDocument.id, { ocrText: event.target.value });
  };

  const handleActivateDemoMode = () => {
    if (!isMockMode) {
      MockingStateManager.enableMockMode();
      setIsMockMode(true);
      console.log('🎭 Demo mode activated via heading click');
    }
  };

  const handleContinue = () => {
    // Save all documents with their updated OCR text
    documents.forEach(doc => {
      documentStore.updateDocument(doc.id, { 
        ocrText: doc.ocrText
      });
    });
    
    // Assign default document types automatically (silently)
    documents.forEach(doc => {
      // Try to guess document type from filename
      const defaultType = getDefaultDocumentType(doc.originalFilename);
      documentStore.updateDocument(doc.id, {
        aiClassifiedType: defaultType,
        userConfirmedType: defaultType,
        finalDocumentType: defaultType
      });
    });
    
    // Navigate directly to checklist verification
    router.push('/checklist-verification');
  };
  
  // Helper function to guess document type from filename
  const getDefaultDocumentType = (filename: string): string => {
    filename = filename.toLowerCase();
    
    if (filename.includes('aadhar') || filename.includes('pan') || 
        filename.includes('passport') || filename.includes('voter') ||
        filename.includes('id') || filename.includes('identity')) {
      return 'identity_proof';
    } else if (filename.includes('address') || filename.includes('utility') || 
              filename.includes('bill') || filename.includes('residence')) {
      return 'address_proof';
    } else if (filename.includes('salary') || filename.includes('income') || 
              filename.includes('form 16') || filename.includes('itr')) {
      return 'income_proof';
    } else if (filename.includes('photo') || filename.includes('picture') || 
              filename.includes('image')) {
      return 'photo';
    } else if (filename.includes('employment') || filename.includes('job') || 
              filename.includes('appointment') || filename.includes('business')) {
      return 'employment_proof';
    } else if (filename.includes('bank') || filename.includes('statement') || 
              filename.includes('account')) {
      return 'bank_statement';
    } else if (filename.includes('application') || filename.includes('form') || 
              filename.includes('loan')) {
      return 'loan_application';
    } else if (filename.includes('property') || filename.includes('asset') || 
              filename.includes('house') || filename.includes('land')) {
      return 'property_documents';
    } else {
      return 'other';
    }
  };

  // Helper function to get icon based on file extension
  const getDocumentIcon = (originalFilename: string) => {
    const extension = originalFilename.split('.').pop()?.toLowerCase();
    return fileTypeIcons[extension as keyof typeof fileTypeIcons] || fileTypeIcons.default;
  };

  if (error && documents.length === 0) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <div className="text-center text-red-600 mb-4">{error}</div>
            <button
              onClick={() => router.push('/upload')}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Return to Upload
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 
              className={`text-2xl font-bold cursor-pointer select-none transition-colors duration-200 ${
                isMockMode 
                  ? 'text-gray-800 border-b-2 border-yellow-400 pb-1' 
                  : 'text-gray-900 hover:text-gray-700'
              }`}
              onClick={handleActivateDemoMode}
              title={isMockMode ? "Demo Mode Active" : "Click to activate demo mode"}
            >
              Client Document Review
            </h1>
            <p className="text-gray-600">Review extracted data from client financial documents</p>
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
                              src={`/api/documents/preview?filename=${encodeURIComponent(currentDocument.originalFilename)}${currentDocument.s3Key ? `&s3Key=${encodeURIComponent(currentDocument.s3Key)}&source=s3` : ''}`}
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
                                src={`/api/documents/preview?filename=${encodeURIComponent(currentDocument.originalFilename)}${currentDocument.s3Key ? `&s3Key=${encodeURIComponent(currentDocument.s3Key)}&source=s3` : ''}`}
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
                          <div className="text-center">
                            <Image
                              src={getDocumentIcon(currentDocument.originalFilename)}
                              alt="Document Icon"
                              width={64}
                              height={64}
                              className="mx-auto mb-4"
                            />
                            <p className="text-gray-500">Document preview not available</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* OCR Text Editing (Right side) */}
                    <div className="w-1/2 overflow-y-auto p-4 bg-white">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        Financial Data: (Review and correct any extraction errors)
                      </h3>
                      <textarea
                        value={currentDocument.ocrText || ''}
                        onChange={handleOcrTextChange}
                        className="w-full h-[calc(100vh-360px)] rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                        placeholder="No financial data extracted from this document"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Footer with actions */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between">
            <button
              onClick={() => router.push('/upload')}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Upload
            </button>
            <button
              onClick={handleContinue}
              className="py-2 px-4 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Continue to Verification
            </button>
          </div>
        </div>
      </div>
    </div>
    </AppLayout>
  );
} 