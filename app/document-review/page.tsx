'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/legacy/image';
import { documentStore } from '@/utils/documentStore';
import { personalLoanDocumentTypes } from '../document-mapping/page';

// File type to icon mapping
const fileTypeIcons = {
  pdf: '/icons/pdf-icon.png',
  jpg: '/icons/jpg-icon.png',
  jpeg: '/icons/jpg-icon.png',
  png: '/icons/png-icon.png',
  default: '/icons/document-icon.png',
};

export default function DocumentReviewPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Get documents from the document store
    const storedDocuments = documentStore.getDocuments();
    
    if (storedDocuments.length === 0) {
      setError('No documents found. Please upload documents first.');
    } else {
      // Sort documents by filename
      const sortedDocuments = [...storedDocuments].sort((a, b) => 
        a.filename.localeCompare(b.filename)
      );
      
      // Auto-select AI classifications as default user-confirmed selections
      const documentsWithDefaults = sortedDocuments.map(doc => {
        if (doc.aiClassifiedType && !doc.userConfirmedType) {
          return {
            ...doc,
            userConfirmedType: doc.aiClassifiedType
          };
        }
        return doc;
      });
      
      setDocuments(documentsWithDefaults);
      
      // Update document store with default selections
      documentsWithDefaults.forEach(doc => {
        if (doc.aiClassifiedType && !doc.userConfirmedType) {
          documentStore.updateDocument(doc.id, { userConfirmedType: doc.aiClassifiedType });
        }
      });
    }
  }, []);

  const handleDocumentTypeChange = (documentId: number, type: string) => {
    const updatedDocuments = documents.map(doc => {
      if (doc.id === documentId) {
        return { ...doc, userConfirmedType: type };
      }
      return doc;
    });
    
    setDocuments(updatedDocuments);
    
    // Update the document in the store
    documentStore.updateDocument(documentId, { userConfirmedType: type });
  };

  const handleSubmit = () => {
    try {
      console.log('Submitting document review...');
      
      // Save document types
      documents.forEach(doc => {
        documentStore.updateDocument(doc.id, { 
          finalDocumentType: doc.userConfirmedType || doc.aiClassifiedType
        });
      });
      
      console.log('Document types confirmed, navigating to checklist verification...');
      
      // Navigate to checklist verification
      router.push('/checklist-verification');
    } catch (err) {
      console.error('Error during document submission:', err);
      setError('Failed to process documents');
    }
  };
  
  // Helper function to get document type name from ID
  const getDocumentTypeName = (typeId: string) => {
    const docType = personalLoanDocumentTypes.find(type => type.id === typeId);
    return docType ? docType.name : 'Unknown';
  };

  if (error && documents.length === 0) {
    return (
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
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {error && (
        <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <h1 className="text-xl font-semibold text-gray-800">Review AI Document Classification</h1>
          <p className="text-sm text-gray-600 mt-1">
            Review and confirm the document types identified by AI
          </p>
        </div>

        {/* Document List */}
        <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 250px)' }}>
          <div className="space-y-4">
            {documents.map((doc, index) => (
              <div key={doc.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-4 flex items-center">
                  <div className="mr-4 flex-shrink-0">
                    <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-800 font-medium">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-md font-medium text-gray-800">{doc.filename}</h3>
                    <p className="text-sm text-gray-500">
                      AI classified as: {doc.aiClassifiedType ? getDocumentTypeName(doc.aiClassifiedType) : 'Unclassified'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm document type:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {personalLoanDocumentTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleDocumentTypeChange(doc.id, type.id)}
                        className={`px-3 py-1 text-xs rounded-full ${
                          doc.userConfirmedType === type.id
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                            : doc.aiClassifiedType === type.id
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200'
                        }`}
                        title={type.description}
                      >
                        {type.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer with actions */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between">
          <button
            onClick={() => router.push('/processing')}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            className="py-2 px-4 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Confirm All Document Types
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to get icon based on file extension
const getDocumentIcon = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  return fileTypeIcons[extension as keyof typeof fileTypeIcons] || fileTypeIcons.default;
}; 