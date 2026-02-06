'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { documentStore } from '@/utils/documentStore';
import AppLayout from '@/app/components/AppLayout';

export default function BusinessChecklistVerificationPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    // Get documents from the store
    const storedDocuments = documentStore.getDocuments();
    
    if (storedDocuments.length === 0) {
      // No documents found, redirect to upload
      router.push('/business-upload');
      return;
    }
    
    setDocuments(storedDocuments);
    setLoading(false);
  }, [router]);
  
  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading business documents...</p>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Loan Document Review</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Your documents have been processed successfully. Review the summary below before proceeding.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Document Summary</h2>
          
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg mb-6">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Document Name</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Size</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">OCR Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                      {doc.originalFilename}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {doc.ocrText ? `${doc.ocrText.length} chars` : '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      {doc.ocrText && doc.ocrText.length > 0 && !doc.ocrText.startsWith('[No OCR') ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          OCR Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          No OCR Text
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Processing Summary</h3>
            <ul className="ml-5 list-disc text-sm text-gray-600 space-y-1">
              <li>Total documents processed: {documents.length}</li>
              <li>Documents with OCR text: {documents.filter(doc => doc.ocrText && doc.ocrText.length > 0 && !doc.ocrText.startsWith('[No OCR')).length}</li>
              <li>Documents without OCR text: {documents.filter(doc => !doc.ocrText || doc.ocrText.length === 0 || doc.ocrText.startsWith('[No OCR')).length}</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={() => router.push('/business-document-mapping')}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Back to Document Review
          </button>
          
          <button
            onClick={() => alert('Documents have been successfully processed. This feature is under development.')}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            Complete Process
          </button>
        </div>
      </div>
    </div>
    </AppLayout>
  );
} 