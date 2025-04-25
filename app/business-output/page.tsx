'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { documentStore } from '@/utils/documentStore';
import Link from 'next/link';

interface BusinessAnalysisOutput {
  part1: {
    applicant_details: Record<string, string>;
    co_applicant_details?: Record<string, string>;
    business_details: Record<string, string | number>;
  };
  part2: {
    document_analysis: Record<string, string>;
  };
  part3: {
    overall_analysis: string[];
  };
}

interface BusinessDocument {
  id: string;
  name: string;
  content: string;
}

export default function BusinessOutputPage() {
  const [businessDocuments, setBusinessDocuments] = useState<BusinessDocument[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const router = useRouter();
  
  useEffect(() => {
    // Load analysis results from the document store
    const loadAnalysisResults = async () => {
      try {
        setLoading(true);
        
        // Get the verification results directly from the documentStore
        const verificationResults = documentStore.getVerificationResults();
        
        if (!verificationResults) {
          console.error("No analysis results found in document store");
          setError("No analysis results found. Please go back and complete the document analysis process.");
          setLoading(false);
          return;
        }
        
        console.log("Retrieved analysis result from document store:", verificationResults);
        setAnalysis(verificationResults);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load analysis results:", err);
        setError("Failed to load analysis results. Please try again.");
        setLoading(false);
      }
    };
    
    loadAnalysisResults();
  }, []);
  
  const handleRetry = () => {
    router.push('/business-document-mapping');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Analyzing business documents...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center text-red-600 max-w-md p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="mb-6">{error}</p>
          <div className="flex space-x-4 justify-center">
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleRetry}
            >
              Return to Documents
            </button>
            <button 
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!analysis) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">No documents to analyze.</p>
          <Link href="/business-document-upload" className="block mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Upload Documents
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Business Loan Application Analysis</h1>
      
      {/* Applicant and Business Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Applicant Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Applicant Details</h2>
          {analysis?.part1?.applicant_details ? (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(analysis.part1.applicant_details).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <p className="text-gray-600 text-sm">{formatLabel(key)}</p>
                  <p className="font-medium">{formatValue(value)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No applicant details found</p>
          )}
          
          {/* Co-Applicant Details if available */}
          {analysis?.part1?.co_applicant_details && Object.keys(analysis.part1.co_applicant_details).length > 0 && (
            <>
              <h3 className="text-lg font-semibold mt-6 mb-3 border-b pb-2">Co-Applicant Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(analysis.part1.co_applicant_details).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <p className="text-gray-600 text-sm">{formatLabel(key)}</p>
                    <p className="font-medium">{formatValue(value)}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Business Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Business Details</h2>
          {analysis?.part1?.business_details ? (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(analysis.part1.business_details).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <p className="text-gray-600 text-sm">{formatLabel(key)}</p>
                  <p className="font-medium">{formatValue(value)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No business details found</p>
          )}
        </div>
      </div>
      
      {/* Document Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Document Analysis</h2>
        {analysis?.part2?.document_analysis && Object.keys(analysis.part2.document_analysis).length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {Object.entries(analysis.part2.document_analysis).map(([docName, docAnalysis]) => (
              <div key={docName} className="border rounded p-4 bg-gray-50">
                <h3 className="font-semibold text-blue-600 mb-2 text-lg">{docName}</h3>
                <div className="text-gray-700 whitespace-pre-line">
                  {typeof docAnalysis === 'object' 
                    ? Object.entries(docAnalysis).map(([key, value]) => (
                        <div key={key} className="mb-1">
                          <span className="font-medium">{formatLabel(key)}: </span>
                          <span>{formatValue(value)}</span>
                        </div>
                      ))
                    : formatValue(docAnalysis)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No document analysis available</p>
        )}
      </div>
      
      {/* Overall Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Overall Analysis</h2>
        {analysis?.part3?.overall_analysis && analysis.part3.overall_analysis.length > 0 ? (
          <ul className="list-disc pl-5 space-y-2">
            {analysis.part3.overall_analysis.map((insight: string, index: number) => (
              <li key={index} className="text-gray-700">{insight}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No overall analysis available</p>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between mt-8">
        <Link 
          href="/business-document-upload" 
          className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Documents
        </Link>
        <div className="flex gap-3">
          <button 
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={() => window.print()}
          >
            Print Report
          </button>
          <button 
            className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </button>
        </div>
      </div>
      
      {/* Debug Output */}
      {showDebug && (
        <div className="mt-8 p-4 border rounded bg-gray-100">
          <h2 className="text-lg font-semibold mb-2">Raw LLM Output</h2>
          <div className="overflow-auto max-h-[500px]">
            <pre className="text-xs bg-black text-green-400 p-4 rounded whitespace-pre-wrap">
              {JSON.stringify(analysis, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to format label
function formatLabel(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to format value
function formatValue(value: any): string {
  if (value === null || value === undefined) return 'Not Available';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}