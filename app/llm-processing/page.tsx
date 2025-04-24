'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { documentStore } from '@/utils/documentStore';
import { personalLoanDocumentTypes } from '@/models/DocumentTypes';

export default function LlmProcessingPage() {
  const [processingStatus, setProcessingStatus] = useState({
    completed: 0,
    total: 0,
    currentFile: '',
  });
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Process documents with LLM for classification
    const processDocuments = async () => {
      try {
        // Get documents from the document store
        const documents = documentStore.getDocuments();
        
        if (documents.length === 0) {
          setError('No documents found to process');
          return;
        }

        // Sort documents by filename
        const sortedDocuments = [...documents].sort((a, b) => 
          a.originalFilename.localeCompare(b.originalFilename)
        );

        // Check if documents are already classified (from background process)
        const alreadyClassified = sortedDocuments.every(doc => doc.aiClassifiedType);
        
        if (alreadyClassified) {
          console.log('Documents already classified in background, redirecting to review page');
          router.push('/document-review');
          return;
        }

        // Initialize processing status
        setProcessingStatus({
          completed: 0,
          total: sortedDocuments.length,
          currentFile: sortedDocuments[0].originalFilename,
        });
        
        // Process each document with a delay to simulate LLM API calls
        for (let i = 0; i < sortedDocuments.length; i++) {
          const doc = sortedDocuments[i];
          
          setProcessingStatus({
            completed: i,
            total: sortedDocuments.length,
            currentFile: doc.originalFilename,
          });
          
          console.log(`Processing document: ${doc.originalFilename}`);
          
          // Skip documents that are already classified from background process
          if (doc.aiClassifiedType) {
            console.log(`Document ${doc.originalFilename} already classified as ${doc.aiClassifiedType}, skipping`);
            continue;
          }
          
          // Simulate LLM classification by assigning document types
          // In a real application, this would call an LLM API with the document originalFilename
          // and OCR text to classify the document
          
          let classifiedType;
          
          // Simplified document type inference based on originalFilename
          // This is a mock implementation - in production, this would be an LLM call
          if (doc.ocrText) {
            // Simple keyword matching for demo purposes - in real app would use LLM
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
            } else {
              // Fallback to 'other'
              classifiedType = 'other';
            }
          } else {
            // If no OCR text, use a generic assignment
            classifiedType = 'other';
          }
          
          // Update document with AI-assigned type
          documentStore.updateDocument(doc.id, { 
            aiClassifiedType: classifiedType,
            classificationConfidence: Math.random() * 0.3 + 0.7 // Random confidence between 70-100%
          });
          
          // Simulate processing time (1-2 seconds per document)
          const processingTime = 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, processingTime));
        }
        
        // Update to show all documents are processed
        setProcessingStatus({
          completed: sortedDocuments.length,
          total: sortedDocuments.length,
          currentFile: '',
        });
        
        // Wait a moment then navigate to document review
        setTimeout(() => {
          router.push('/document-review');
        }, 1500);
      } catch (err: any) {
        console.error('Error during LLM processing:', err);
        setError(err.message || 'An error occurred during document classification');
      }
    };

    processDocuments();
  }, [router]);

  // Calculate progress percentage
  const progressPercentage = Math.round((processingStatus.completed / processingStatus.total) * 100) || 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Classifying Documents with AI</h1>
          <p className="text-gray-600">
            Our AI is analyzing your documents and determining their types.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Processing</span>
            <span className="text-sm font-medium text-gray-700">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          {processingStatus.currentFile && (
            <p className="mt-2 text-sm text-gray-500">
              Currently classifying: {processingStatus.currentFile}
            </p>
          )}

          <div className="mt-4 text-sm text-gray-500 flex items-center">
            <span className="font-medium mr-2">{processingStatus.completed}</span> 
            of 
            <span className="font-medium mx-2">{processingStatus.total}</span> 
            documents classified
          </div>
        </div>

        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-middle"></div>
          </div>
          
          <div className="space-y-2 text-sm text-gray-500">
            <p>Using AI to classify document types</p>
            <p>Matching documents to required loan categories</p>
            <p>Organizing documents for review</p>
          </div>
        </div>
      </div>
    </div>
  );
} 