'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { documentStore } from '@/utils/documentStore';
import AppLayout from '@/app/components/AppLayout';

// Component that uses useSearchParams
function ProcessingContent() {
  const [processingStep, setProcessingStep] = useState(1);
  const [status, setStatus] = useState('Initializing OCR process...');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const s3Key = searchParams.get('s3Key');
  const docType = searchParams.get('docType'); // Get document type parameter (business or personal)
  const isBusinessLoan = docType === 'business';

  useEffect(() => {
    if (!s3Key) {
      setError('No document S3 key provided');
      return;
    }

    const processDocuments = async () => {
      try {
        // Step 1: OCR Processing - Call OCR API
        setProcessingStep(1);
        setStatus('Extracting text with OCR...');

        // Call the OCR API
        const ocrResponse = await fetch('/api/process/ocr-zip', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ s3Key, docType }), // Pass document type to the API
        });

        if (!ocrResponse.ok) {
          // Safely handle both JSON and non-JSON error responses
          let errorMessage = `OCR processing failed (status ${ocrResponse.status})`;
          try {
            const errorText = await ocrResponse.text();
            console.error('OCR API error response:', ocrResponse.status, errorText);
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || errorMessage;
              if (errorData.actionRequired) {
                errorMessage += '. ' + errorData.actionRequired;
              }
            } catch {
              // Response was not JSON (e.g. gateway error like "Request Entity Too Large")
              errorMessage = errorText || errorMessage;
            }
          } catch {
            console.error('Failed to read error response body');
          }

          setError(errorMessage);
          return; // Stop processing if OCR failed
        }

        const ocrResult = await ocrResponse.json();
        console.log('OCR processing result:', ocrResult);

        // Check if the response contains an error
        if (!ocrResult.success || ocrResult.error) {
          setError(ocrResult.error || 'OCR processing failed. Please try reuploading your documents.');
          return; // Stop processing if OCR failed
        }

        // Debug log to check the structure of the response
        console.log('OCR result structure:');
        console.log('- success:', ocrResult.success);
        console.log('- localFiles:', ocrResult.localFiles ? `${ocrResult.localFiles.length} files` : 'none');
        console.log('- result structure:', ocrResult.result ? typeof ocrResult.result : 'none');

        // Check if we have local files
        if (!ocrResult.localFiles || ocrResult.localFiles.length === 0) {
          setError('No files were found in your uploaded documents. Please try uploading different files.');
          return; // Stop processing if no files
        }

        // Check if the result is missing or incomplete
        if (!ocrResult.result || Object.keys(ocrResult.result).length === 0) {
          setError('OCR processing returned empty results. Please try reuploading your documents.');
          return; // Stop processing if OCR result is empty
        }

        // Wait a moment to show progress
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 2: Process OCR results
        setProcessingStep(2);
        setStatus('Analyzing document content...');

        // Use actual documents from OCR result instead of mock data
        let processedDocuments = [];

        if (ocrResult && ocrResult.localFiles && ocrResult.localFiles.length > 0) {
          console.log('Creating processed documents from localFiles and OCR results');

          // Get the list of files extracted from the ZIP
          const extractedFiles = ocrResult.localFiles;
          console.log(`Processing ${extractedFiles.length} extracted files`);

          // Get the OCR results
          const ocrData = ocrResult.result;

          // Create a document for each extracted file
          processedDocuments = extractedFiles.map((file: any, index: number) => {
            const ocrText = ocrData[file.name] || `[No OCR text available for ${file.name}]`;
            console.log(`Document ${index + 1}: "${file.name}", OCR text length: ${ocrText.length > 0 ? ocrText.length : 0}, s3Key: ${file.s3Key || 'none'}`);

            return {
              id: index + 1,
              originalFilename: file.name,
              thumbnailUrl: file.path,
              filePath: file.path,
              s3Key: file.s3Key, // Store S3 key for preview
              type: inferDocumentType(file.name),
              filetype: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
              ocrText: typeof ocrText === 'string' ? ocrText : String(ocrText),
              userSession: s3Key // Add session identifier to link documents to this upload session
            };
          });

          console.log(`Created ${processedDocuments.length} documents from extracted files with session key: ${s3Key}`);
        } else if (ocrResult && ocrResult.result) {
          // Fallback: Try to create documents from OCR result directly
          console.log('No extracted files found, trying to create documents from OCR results directly');

          const ocrData = ocrResult.result;

          if (typeof ocrData === 'object' && ocrData !== null) {
            processedDocuments = Object.entries(ocrData).map(([filename, ocrText], index) => {
              return {
                id: index + 1,
                originalFilename: filename,
                thumbnailUrl: null,
                filePath: null,
                type: inferDocumentType(filename),
                filetype: filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
                ocrText: typeof ocrText === 'string' ? ocrText : String(ocrText)
              };
            });

            console.log(`Created ${processedDocuments.length} documents from OCR data`);
          }
        }

        if (processedDocuments.length === 0) {
          setError('No documents could be processed from your upload. Please try a different file.');
          return;
        }

        console.log('Final processed documents:', processedDocuments);

        // Display warning if there was an OCR service error
        if (ocrResult && (ocrResult.hasError || ocrResult.result?.warning)) {
          setError(ocrResult.errorMessage || ocrResult.result?.warning || 'The OCR service encountered an error. Some documents may have incomplete text extraction.');
          // Short pause to ensure user sees the warning
          await new Promise(resolve => setTimeout(resolve, 2000));
          // Clear error to allow continuing
          setError('');
        }

        // Make sure all documents have OCR text
        const validDocuments = processedDocuments.filter((doc: any) => {
          if (!doc.ocrText || doc.ocrText.trim().length === 0) {
            console.warn(`Document ${doc.originalFilename} has no OCR text, skipping`);
            return false;
          }
          return true;
        });

        if (validDocuments.length === 0) {
          setError('No valid OCR data could be extracted from your documents. Please try a different file.');
          return;
        }

        // Store documents in our document store
        documentStore.clearDocuments();
        validDocuments.forEach((doc: any) => {
          // Add the document to the store with its OCR text
          documentStore.addDocument({
            ...doc,
            userSession: s3Key, // Make sure the session ID is stored
            uploadTimestamp: new Date(),
            processingStatus: 'completed'
          });
        });

        console.log(`Stored ${validDocuments.length} documents with OCR text in document store`);

        // Wait to simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 3: Preparing for document review
        setProcessingStep(3);
        setStatus('Preparing OCR results for review...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Navigate to appropriate document mapping page based on document type
        if (isBusinessLoan) {
          router.push(`/business-document-mapping?s3Key=${encodeURIComponent(s3Key)}`);
        } else {
          router.push(`/document-mapping?s3Key=${encodeURIComponent(s3Key)}`);
        }
      } catch (err: any) {
        console.error('Processing error:', err);
        setError(err.message || 'An error occurred during processing');
      }
    };

    processDocuments();
  }, [s3Key, docType, isBusinessLoan, router]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Document Processing</h1>
            <p className="text-gray-600">
              Your client documents are being processed for financial assessment. This typically takes 1-2 minutes.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
              <p>Something went wrong. Please check your network connection and try again.</p>
              <p className="text-xs mt-2 text-gray-600">Error details: {error}</p>
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={() => router.push('/upload')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Return to Upload
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Retry Processing
                </button>
              </div>
            </div>
          )}

          {!error && (
            <div className="mb-8">
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${processingStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                    }`}>
                    {processingStep > 1 ? '✓' : '1'}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-900">OCR Processing</h2>
                    <p className="text-sm text-gray-500">Extracting financial data from documents</p>
                  </div>
                </div>

                {/* Line connector */}
                <div className="ml-4 pl-0.5 h-10 border-l-2 border-indigo-600"></div>

                <div className="flex items-center mb-2">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${processingStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                    }`}>
                    {processingStep > 2 ? '✓' : '2'}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-900">Document Analysis</h2>
                    <p className="text-sm text-gray-500">Categorizing and validating financial records</p>
                  </div>
                </div>

                {/* Line connector */}
                <div className="ml-4 pl-0.5 h-10 border-l-2 border-indigo-600"></div>

                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${processingStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                    }`}>
                    {processingStep > 3 ? '✓' : '3'}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-900">Finalizing</h2>
                    <p className="text-sm text-gray-500">Preparing document analysis for review</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!error && (
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-middle"></div>
              <p className="mt-4 text-sm font-medium text-gray-700">{status}</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// Loading fallback component
function ProcessingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Document Processing</h1>
          <p className="text-gray-600">Loading processing information...</p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function ProcessingPage() {
  return (
    <Suspense fallback={<ProcessingFallback />}>
      <ProcessingContent />
    </Suspense>
  );
}

// Helper function to infer document type from filename
function inferDocumentType(filename: string): string {
  const lowerName = filename.toLowerCase();

  if (lowerName.includes('aadhar') || lowerName.includes('aadhaar') || lowerName.includes('pan') ||
    lowerName.includes('id') || lowerName.includes('card')) {
    return 'identification';
  } else if (lowerName.includes('salary') || lowerName.includes('payslip') || lowerName.includes('income')) {
    return 'income';
  } else if (lowerName.includes('bank') || lowerName.includes('statement')) {
    return 'bank_statement';
  } else if (lowerName.includes('tax') || lowerName.includes('itr') || lowerName.includes('return')) {
    return 'tax';
  } else if (lowerName.includes('bill') || lowerName.includes('utility') || lowerName.includes('electricity')) {
    return 'utility_bill';
  } else {
    return 'other';
  }
} 