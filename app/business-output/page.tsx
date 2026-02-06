'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { documentStore } from '@/utils/documentStore';
import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import AppLayout from '@/app/components/AppLayout';

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

// Import the file type icons mapping from the document mapping page
const fileTypeIcons = {
  pdf: '/icons/pdf.svg',
  jpg: '/icons/image.svg',
  jpeg: '/icons/image.svg',
  png: '/icons/image.svg',
  doc: '/icons/doc.svg',
  docx: '/icons/doc.svg',
  xls: '/icons/excel.svg',
  xlsx: '/icons/excel.svg',
  txt: '/icons/text.svg',
  default: '/icons/document.svg'
};

export default function BusinessOutputPage() {
  const [businessDocuments, setBusinessDocuments] = useState<BusinessDocument[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0); // 0: Applicant Details, 1: Document Analysis, 2: Overall Analysis
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

        // Get the documents from the document store
        const storedDocuments = documentStore.getDocuments();
        
        console.log("Retrieved analysis result from document store:", verificationResults);
        console.log("Retrieved documents from document store:", storedDocuments);
        
        setAnalysis(verificationResults);
        setDocuments(storedDocuments);
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

  // Helper function to get icon based on file extension
  const getDocumentIcon = (originalFilename: string) => {
    const extension = originalFilename?.split('.').pop()?.toLowerCase();
    return fileTypeIcons[extension as keyof typeof fileTypeIcons] || fileTypeIcons.default;
  };

  // Tab configuration
  const tabs = [
    { id: 0, name: "Applicant Details" },
    { id: 1, name: "Document Analysis" },
    { id: 2, name: "Overall Analysis" }
  ];
  
  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-lg">Analyzing business documents...</p>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  if (error) {
    return (
      <AppLayout>
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
      </AppLayout>
    );
  }
  
  if (!analysis) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <p className="text-lg">No documents to analyze.</p>
            <Link href="/business-document-upload" className="block mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Upload Documents
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Business Loan Application Analysis</h1>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none transition-colors duration-200 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        {/* Tab 1: Applicant and Business Details */}
        {activeTab === 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-6 border-b pb-2">Applicant and Business Details</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Applicant Details */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Applicant Details
                </h3>
                {analysis?.part1?.applicant_details ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(analysis.part1.applicant_details).map(([key, value]) => {
                      // Choose appropriate icon based on the field type
                      let icon = null;
                      if (key.includes('name')) {
                        icon = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        );
                      } else if (key.includes('phone') || key.includes('mobile')) {
                        icon = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                        );
                      } else if (key.includes('email')) {
                        icon = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                        );
                      } else if (key.includes('dob') || key.includes('date')) {
                        icon = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        );
                      } else if (key.includes('address')) {
                        icon = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        );
                      } else if (key.includes('pan') || key.includes('aadhaar') || key.includes('id')) {
                        icon = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        );
                      } else {
                        icon = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        );
                      }
                      
                      return (
                        <div key={key} className="mb-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition duration-150">
                          <div className="flex items-center mb-1">
                            <span className="mr-2">{icon}</span>
                            <p className="text-gray-600 text-sm font-medium">{formatLabel(key)}</p>
                          </div>
                          <p className="font-medium text-gray-800 ml-6">{formatValue(value)}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No applicant details found</p>
                )}
                
                {/* Co-Applicant Details if available */}
                {analysis?.part1?.co_applicant_details && Object.keys(analysis.part1.co_applicant_details).length > 0 && (
                  <>
                    <h3 className="text-lg font-semibold mt-6 mb-3 border-b pb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                      Co-Applicant Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(analysis.part1.co_applicant_details).map(([key, value]) => {
                        // Choose appropriate icon based on the field type
                        let icon = null;
                        if (key.includes('name')) {
                          icon = (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          );
                        } else if (key.includes('phone') || key.includes('mobile')) {
                          icon = (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                          );
                        } else if (key.includes('email')) {
                          icon = (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                          );
                        } else if (key.includes('dob') || key.includes('date')) {
                          icon = (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                          );
                        } else if (key.includes('address')) {
                          icon = (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                          );
                        } else if (key.includes('pan') || key.includes('aadhaar') || key.includes('id')) {
                          icon = (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          );
                        } else {
                          icon = (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          );
                        }
                        
                        return (
                          <div key={key} className="mb-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition duration-150">
                            <div className="flex items-center mb-1">
                              <span className="mr-2">{icon}</span>
                              <p className="text-gray-600 text-sm font-medium">{formatLabel(key)}</p>
                            </div>
                            <p className="font-medium text-gray-800 ml-6">{formatValue(value)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              
              {/* Business Details */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H7a1 1 0 00-1 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                  Business Details
                </h3>
                {analysis?.part1?.business_details ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(analysis.part1.business_details).map(([key, value]) => {
                      // Choose appropriate icon based on the field type
                      let icon = null;
                      if (key.includes('name') || key.includes('business_name')) {
                        icon = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H7a1 1 0 00-1 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                          </svg>
                        );
                      } else if (key.includes('type') || key.includes('category')) {
                        icon = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                          </svg>
                        );
                      } else if (key.includes('gstin') || key.includes('tax')) {
                        icon = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
                          </svg>
                        );
                      } else if (key.includes('turnover') || key.includes('revenue') || key.includes('income')) {
                        icon = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                          </svg>
                        );
                      } else if (key.includes('address') || key.includes('location')) {
                        icon = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        );
                      } else if (key.includes('vintage') || key.includes('years') || key.includes('established')) {
                        icon = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        );
                      } else {
                        icon = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        );
                      }
                      
                      return (
                        <div key={key} className="mb-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition duration-150">
                          <div className="flex items-center mb-1">
                            <span className="mr-2">{icon}</span>
                            <p className="text-gray-600 text-sm font-medium">{formatLabel(key)}</p>
                          </div>
                          <p className="font-medium text-gray-800 ml-6">{formatValue(value)}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No business details found</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Tab 2: Document Analysis */}
        {activeTab === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-6 border-b pb-2">Document Analysis</h2>
            {analysis?.part2?.document_analysis && Object.keys(analysis.part2.document_analysis).length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {Object.entries(analysis.part2.document_analysis).map(([docName, docAnalysis]) => {
                  // Find the corresponding document by filename
                  const matchingDocument = documents.find(doc => 
                    doc.originalFilename && doc.originalFilename.toLowerCase().includes(docName.toLowerCase()));
                  
                  return (
                    <div key={docName} className="border rounded overflow-hidden">
                      <h3 className="font-semibold text-blue-600 p-4 bg-gray-50 border-b">{docName}</h3>
                      
                      <div className="flex flex-col md:flex-row">
                        {/* Document Preview (Left side) */}
                        <div className="md:w-1/2 border-r border-gray-200 p-4 bg-gray-50">
                          <div className="bg-white rounded-md shadow-sm p-4 h-[30rem] flex items-center justify-center">
                            {matchingDocument?.originalFilename ? (
                              matchingDocument.filetype === 'application/pdf' ? (
                                <iframe
                                  src={`/api/documents/preview?filename=${encodeURIComponent(matchingDocument.originalFilename)}`}
                                  className="w-full h-full"
                                  title={matchingDocument.originalFilename}
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
                                    src={`/api/documents/preview?filename=${encodeURIComponent(matchingDocument.originalFilename)}`}
                                    alt={matchingDocument.originalFilename}
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
                                    src={getDocumentIcon(docName)}
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
                        
                        {/* Document Analysis (Right side) */}
                        <div className="md:w-1/2 p-4 bg-white">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Analysis</h4>
                          <div className="text-gray-700">
                            {typeof docAnalysis === 'object' && docAnalysis !== null
                              ? Object.entries(docAnalysis).map(([key, value]) => (
                                  <div key={key} className="mb-1">
                                    <span className="font-medium">{formatLabel(key)}: </span>
                                    <span>{formatValue(value)}</span>
                                  </div>
                                ))
                              : parseMarkdown(formatValue(docAnalysis))}
                          </div>
                        </div>
                            </div>
    </div>
  );
})}
              </div>
            ) : (
              <p className="text-gray-500 italic">No document analysis available</p>
            )}
          </div>
        )}
        
        {/* Tab 3: Overall Analysis */}
        {activeTab === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-6 border-b pb-2">Overall Analysis</h2>
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
    </AppLayout>
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

// Helper function to parse basic markdown to HTML
function parseMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  
  // First handle the lines (for bullet points and paragraphs)
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  let currentList: React.ReactNode[] = [];
  
  lines.forEach((line, lineIndex) => {
    // Handle bullet points (lines starting with -)
    if (line.trim().startsWith('- ')) {
      // Add to current list
      currentList.push(
        <li key={`bullet-${lineIndex}`} className="ml-2 mb-1">
          {processMarkdownSegment(line.trim().substring(2))}
        </li>
      );
    } 
    // Handle section headers (like **Key Data:**)
    else if (line.trim().match(/^\*\*[^*]+\*\*:$/)) {
      // If we have a list going, close it before adding a header
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${lineIndex}`} className="list-disc pl-5 my-2">
            {currentList}
          </ul>
        );
        currentList = [];
      }
      
      // Extract header text without ** and :
      const headerText = line.trim().replace(/^\*\*|\*\*:$/g, '');
      elements.push(
        <h4 key={`header-${lineIndex}`} className="font-bold text-blue-700 mt-4 mb-2">
          {headerText}
        </h4>
      );
    }
    else {
      // If we have a list going and this is not a bullet point, close the list
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${lineIndex}`} className="list-disc pl-5 my-2">
            {currentList}
          </ul>
        );
        currentList = [];
      }
      
      // Add regular line
      if (line.trim()) {
        elements.push(
          <div key={`line-${lineIndex}`} className="mb-2">
            {processMarkdownSegment(line)}
          </div>
        );
      } else {
        // Empty line - add some spacing
        elements.push(<div key={`space-${lineIndex}`} className="h-2"></div>);
      }
    }
  });
  
  // If we have an unclosed list at the end
  if (currentList.length > 0) {
    elements.push(
      <ul key="final-list" className="list-disc pl-5 my-2">
        {currentList}
      </ul>
    );
  }
  
  return <>{elements}</>;
}

// Process bold text and other inline formatting
function processMarkdownSegment(text: string): React.ReactNode {
  // Split text by double asterisks
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  
  // Map segments to either regular text or bold elements
  return segments.map((segment, index) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      // This is a bold text, remove the ** and wrap in a strong tag
      const content = segment.slice(2, -2);
      return <strong key={`bold-${index}`} className="font-semibold">{content}</strong>;
    }
    
    // Regular text
    return segment;
  });
}