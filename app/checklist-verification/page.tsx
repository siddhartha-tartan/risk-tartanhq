'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { documentStore } from '@/utils/documentStore';
import { MockingStateManager } from '@/utils/mockingState';
import { Metadata } from 'next';
import DataTable from './components/DataTable';
import LoanChecklistTable from './components/LoanChecklistTable';
import AIInsightsPanel from './components/AIInsightsPanel';
import { Tab } from '@headlessui/react';
import { classNames } from '@/utils/classNames';
import ReactMarkdown from 'react-markdown';
import AppLayout from '@/app/components/AppLayout';
import Lottie from 'lottie-react';
import animationData from '@/public/animations/loader.json';

// Field name mappings (same as backend)
const FIELD_MAPPING = {
  // Short names → UI expected names
  "category": "Category",
  "document": "Document (to check from)",
  "dataMatching": "Data Entry Matching (to be checked by AI)",
  "applicantValid": "Applicant",
  "evidence": "evidence"
};

// Helper function to safely get value using either old or new field names
const getFieldValue = (item: any, fieldName: string, fallback: any = '') => {
  // Try short name first, then UI expected name, then fallback
  return item[fieldName] !== undefined ? item[fieldName] 
         : item[FIELD_MAPPING[fieldName as keyof typeof FIELD_MAPPING]] !== undefined 
           ? item[FIELD_MAPPING[fieldName as keyof typeof FIELD_MAPPING]] 
           : fallback;
};

// Helper function to determine verification status
const getVerificationStatus = (item: any) => {
  if (!item.Field_data_found_in_OCR) return 'warning';
  
  if (item.Field_data_found_in_OCR === 'Document not found' || 
      item.Field_data_found_in_OCR === 'Data not found in Document OCR') {
    return 'error';
  }
  
  return 'success';
};

// Function to get status badge color
const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Add a normalization helper to standardize field access
const normalizeFieldNames = (items: any[]): any[] => {
  if (!items || !Array.isArray(items) || items.length === 0) return [];
  
  return items.map(item => {
    const normalized = { ...item };
    
    // Standardize field names - handle different formats from API
    // Source fields
    if (item.Source_found_in_OCR && !item.Source_where_actually_data_is_found) {
      normalized.Source_where_actually_data_is_found = item.Source_found_in_OCR;
    } else if (item.Source_where_actually_data_is_found && !item.Source_found_in_OCR) {
      normalized.Source_found_in_OCR = item.Source_where_actually_data_is_found;
    }
    
    // Comment fields
    if (item.AI_Comments && !item.ai_comments) {
      normalized.ai_comments = item.AI_Comments;
    } else if (item.ai_comments && !item.AI_Comments) {
      normalized.AI_Comments = item.ai_comments;
    }
    
    return normalized;
  });
};

export default function ChecklistVerificationPage() {
  const [verificationResults, setVerificationResults] = useState<any[]>([]);
  const [loanChecklistData, setLoanChecklistData] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [camSummary, setCamSummary] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loanChecklistLoading, setLoanChecklistLoading] = useState(true);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(true);
  const [camSummaryLoading, setCamSummaryLoading] = useState(true);
  const [loanChecklistError, setLoanChecklistError] = useState<string | null>(null);
  const [aiInsightsError, setAiInsightsError] = useState<string | null>(null);
  const [camSummaryError, setCamSummaryError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [rawLlmOutput, setRawLlmOutput] = useState<string>('');
  const [rawLoanChecklistOutput, setRawLoanChecklistOutput] = useState<string>('');
  const [rawAiInsightsOutput, setRawAiInsightsOutput] = useState<string>('');
  const [rawCamSummaryOutput, setRawCamSummaryOutput] = useState<string>('');
  const [activeTab, setActiveTab] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState('loanChecklist');
  const [showCreditDebug, setShowCreditDebug] = useState(false);
  const [showLoanChecklistDebug, setShowLoanChecklistDebug] = useState(false);
  const [showAIInsightsDebug, setShowAIInsightsDebug] = useState(false);
  const [showCamSummaryDebug, setShowCamSummaryDebug] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    verifyDocuments();
    
    const openModalListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      setSelectedItem(customEvent.detail);
      setIsModalOpen(true);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('openDetailsModal', openModalListener);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('openDetailsModal', openModalListener);
      }
    };
  }, [router]);
  
  const verifyDocuments = async () => {
    try {
      // Get documents from store
      const documents = documentStore.getDocuments();
      
      if (!documents || documents.length === 0) {
        setError('No documents found for verification');
        setLoading(false);
        setAiInsightsLoading(false);
        setLoanChecklistLoading(false);
        setCamSummaryLoading(false);
        return;
      }
      
      console.log(`Processing ${documents.length} documents for verification`);
      
      // Fire all requests in parallel
      fetchVerificationResults(documents);
      fetchLoanChecklistData(documents);
      fetchAiInsights(documents);
      fetchCamSummary(documents);

    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify documents against checklist');
      setLoading(false);
      setAiInsightsLoading(false);
      setLoanChecklistLoading(false);
      setCamSummaryLoading(false);
    }
  };
  
  const fetchVerificationResults = async (documents: any[]) => {
    try {
      setLoading(true);
      // Verify documents against checklist
      const response = await fetch('/api/process/verify-checklist', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...MockingStateManager.getMockHeaders()
        },
        body: JSON.stringify({ documents })
      });
      
      if (!response.ok) throw new Error('Verification failed');
      
      const data = await response.json();
      console.log('Verification results received:', data);
      
      // Store raw LLM output if available
      if (data.rawLlmOutput) {
        console.log('Raw LLM output available, storing for display');
        setRawLlmOutput(data.rawLlmOutput);
      }
      
      // Handle both array and object formats from the API
      if (data.verificationResults) {
        if (Array.isArray(data.verificationResults)) {
          // Normalize field names
          const normalizedResults = normalizeFieldNames(data.verificationResults);
          setVerificationResults(normalizedResults);
          console.log('Using normalized array results directly');
        } else if (data.verificationResults.result && Array.isArray(data.verificationResults.result)) {
          // Handle the case where results are in a 'result' property
          console.log('Found results in result property, extracting array');
          const normalizedResults = normalizeFieldNames(data.verificationResults.result);
          setVerificationResults(normalizedResults);
        } else if (data.verificationResults.results && Array.isArray(data.verificationResults.results)) {
          // Handle the case where results are in a 'results' property
          console.log('Found results in results property, extracting array');
          const normalizedResults = normalizeFieldNames(data.verificationResults.results);
          setVerificationResults(normalizedResults);
        } else if (data.verificationResults.checklist && Array.isArray(data.verificationResults.checklist)) {
          // Handle the case where results are wrapped in a 'checklist' property
          console.log('Found results in checklist property, extracting array');
          const normalizedResults = normalizeFieldNames(data.verificationResults.checklist);
          setVerificationResults(normalizedResults);
        } else {
          // If it's not an array, convert it to an array of objects
          console.log('Converting object to array format, structure:', Object.keys(data.verificationResults));
          
          // Check if the data looks like an array of key-value objects (like the example in the user query)
          if (Array.isArray(data.verificationResults) && data.verificationResults.length > 0 && 
              data.verificationResults[0].hasOwnProperty('Category') && data.verificationResults[0].hasOwnProperty('value')) {
            // This is already an array of Category/value pairs
            // We need to reconstruct a proper object from these pairs
            const reconstructedObject: any = {};
            
            // Group items by s_no if it exists
            let currentGroup: any = {};
            let currentSno: string | number | null = null;
            
            data.verificationResults.forEach((item: any) => {
              const category = item.Category;
              const value = item.value;
              
              if (category === 's_no') {
                // Start a new group if we encounter a new s_no
                if (currentSno !== null) {
                  reconstructedObject[currentSno] = currentGroup;
                }
                currentSno = value;
                currentGroup = {};
              } else if (currentSno !== null) {
                // Add to current group
                currentGroup[category] = value;
              }
            });
            
            // Add the last group
            if (currentSno !== null) {
              reconstructedObject[currentSno] = currentGroup;
            }
            
            // Convert back to array format
            const arrData = Object.values(reconstructedObject);
            const normalizedResults = normalizeFieldNames(arrData);
            setVerificationResults(normalizedResults);
            console.log('Reconstructed proper objects from Category/value pairs');
          } else {
            // Standard object-to-array conversion
            const arrData = Object.entries(data.verificationResults).map(([key, value]) => {
              if (typeof value === 'object' && value !== null) {
                return value;
              }
              return { Category: key, value };
            });
            const normalizedResults = normalizeFieldNames(arrData);
            setVerificationResults(normalizedResults);
          }
        }
        console.log('Processed verification results for UI rendering, count:', verificationResults.length);
      } else {
        throw new Error('No verification results returned from API');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify documents against checklist');
    } finally {
      setLoading(false);
    }
  }
  
  const fetchLoanChecklistData = async (documents: any[]) => {
    try {
      setLoanChecklistLoading(true);
      
      console.log(`Processing ${documents.length} documents for loan checklist verification`);
      
      // Call the loan checklist verification API
      const response = await fetch('/api/process/verify-loan-checklist', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...MockingStateManager.getMockHeaders()
        },
        body: JSON.stringify({ documents })
      });
      
      if (!response.ok) throw new Error('Loan checklist verification failed');
      
      const data = await response.json();
      console.log('Loan checklist results received:', data);
      
      // Store raw LLM output if available
      if (data.rawLlmOutput) {
        console.log('Raw loan checklist LLM output available, storing for display');
        setRawLoanChecklistOutput(data.rawLlmOutput);
      }
      
      // Process and set loan checklist data
      if (data.loanChecklistResults && Array.isArray(data.loanChecklistResults)) {
        setLoanChecklistData(data.loanChecklistResults);
        console.log('Processed loan checklist results for UI rendering, count:', data.loanChecklistResults.length);
      } else {
        throw new Error('No loan checklist results returned from API');
      }
    } catch (err: any) {
      console.error('Loan checklist verification error:', err);
      setLoanChecklistError(err.message || 'Failed to verify documents against loan checklist');
    } finally {
      setLoanChecklistLoading(false);
    }
  };
  
  const fetchAiInsights = async (documents: any[]) => {
    try {
      setAiInsightsLoading(true);
      
      console.log(`Processing ${documents.length} documents for AI insights generation`);
      
      // Call the AI insights generation API
      const response = await fetch('/api/process/generate-ai-insights', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...MockingStateManager.getMockHeaders()
        },
        body: JSON.stringify({ documents })
      });
      
      if (!response.ok) throw new Error('AI insights generation failed');
      
      const data = await response.json();
      console.log('AI insights results received:', data);
      
      // Store raw LLM output if available
      if (data.rawLlmOutput) {
        console.log('Raw AI insights LLM output available, storing for display');
        setRawAiInsightsOutput(data.rawLlmOutput);
      }
      
      // Process and set AI insights data
      if (data.insights && Array.isArray(data.insights)) {
        setAiInsights(data.insights);
        console.log('Processed AI insights for UI rendering, count:', data.insights.length);
      } else {
        throw new Error('No AI insights returned from API');
      }
    } catch (err: any) {
      console.error('AI insights generation error:', err);
      setAiInsightsError(err.message || 'Failed to generate AI insights');
      
      // Set default insights in case of error
      setAiInsights([
        {
          title: 'Error Generating Insights',
          description: 'There was an error analyzing the documents. Please try again.',
          type: 'error'
        }
      ]);
    } finally {
      setAiInsightsLoading(false);
    }
  };
  
  const fetchCamSummary = async (documents: any[]) => {
    try {
      setCamSummaryLoading(true);
      
      console.log(`Processing ${documents.length} documents for CAM Summary generation`);
      
      // Call the CAM Summary generation API
      const response = await fetch('/api/process/generate-cam-summary', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...MockingStateManager.getMockHeaders()
        },
        body: JSON.stringify({ documents })
      });
      
      if (!response.ok) throw new Error('CAM Summary generation failed');
      
      const data = await response.json();
      console.log('CAM Summary results received:', data);
      
      // Store raw LLM output if available
      if (data.rawLlmOutput) {
        console.log('Raw CAM Summary LLM output available, storing for display');
        setRawCamSummaryOutput(data.rawLlmOutput);
      }
      
      // Process and set CAM Summary data
      if (data.camSummary) {
        setCamSummary(data.camSummary);
        console.log('Processed CAM Summary for UI rendering');
      } else {
        throw new Error('No CAM Summary returned from API');
      }
    } catch (err: any) {
      console.error('CAM Summary generation error:', err);
      setCamSummaryError(err.message || 'Failed to generate CAM Summary');
    } finally {
      setCamSummaryLoading(false);
    }
  };
  
  const handleComplete = () => {
    // Store verification results
    if (typeof documentStore.setVerificationResults === 'function') {
      documentStore.setVerificationResults(verificationResults);
    }
    
    // Navigate to complete page
    router.push('/complete');
  };
  
  // Get unique categories for tabs
  const categories = ['All', ...Array.from(new Set(verificationResults.map(item => 
    item.Source_to_be_looked_at_in_ocr
  )))].filter(Boolean);
  
  // Filter results based on active tab
  const filteredResults = activeTab === 'All' 
    ? verificationResults 
    : verificationResults.filter(item => item.Source_to_be_looked_at_in_ocr === activeTab);
  
  const openModal = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
  };
  
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Credit Assessment Memo Dashboard</h1>
          <p className="text-gray-600 mb-8">
            Our system has analyzed your client's financial documents and prepared the following verification reports.
          </p>
          
          {loading && (
            <div className="flex flex-col justify-center items-center h-96">
              <div className="w-32 h-32 mb-6">
                <Lottie 
                  animationData={animationData}
                  loop={true}
                  autoplay={true}
                />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Verification Results</h3>
                <p className="text-indigo-600 mb-2">Analyzing your documents and generating comprehensive reports...</p>
                <p className="text-sm text-gray-500">This usually takes 2-3 minutes</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              <p className="font-medium">Error loading verification results</p>
              <p>{error}</p>
            </div>
          )}
        
        {!loading && verificationResults && verificationResults.length > 0 && (
          <>
            {/* Main Content Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <ul className="flex flex-wrap text-sm font-medium text-center text-gray-500">
                <li className="mr-2">
                  <button
                    onClick={() => setActiveContentTab('loanChecklist')}
                    className={`inline-block p-4 rounded-t-lg ${
                      activeContentTab === 'loanChecklist'
                        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                        : 'hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    Login Checklist
                  </button>
                </li>
                <li className="mr-2">
                  <button
                    onClick={() => setActiveContentTab('creditAssessment')}
                    className={`inline-block p-4 rounded-t-lg ${
                      activeContentTab === 'creditAssessment'
                        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                        : 'hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    Credit Assessment Memo
                  </button>
                </li>
                <li className="mr-2">
                  <button
                    onClick={() => setActiveContentTab('aiInsights')}
                    className={`inline-block p-4 rounded-t-lg ${
                      activeContentTab === 'aiInsights'
                        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                        : 'hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    Financial Insights
                  </button>
                </li>
                <li className="mr-2">
                  <button
                    onClick={() => setActiveContentTab('camSummary')}
                    className={`inline-block p-4 rounded-t-lg ${
                      activeContentTab === 'camSummary'
                        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                        : 'hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    CAM Summary
                  </button>
                </li>
              </ul>
            </div>
            
            {/* Credit Assessment Memo Content */}
            {activeContentTab === 'creditAssessment' && (
              <>
                {/* Category Tabs */}
                <div className="mb-3 border-b border-gray-200">
                  <ul className="flex flex-wrap -mb-px">
                    {categories.map((category, idx) => (
                      <li key={idx} className="mr-1">
                        <button
                          onClick={() => setActiveTab(category)}
                          className={`inline-block px-3 py-2 text-sm rounded-t-lg ${
                            activeTab === category
                              ? 'text-indigo-600 border-b-2 border-indigo-600'
                              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {category}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                  <div className="border-b border-gray-200 bg-gray-50 p-4">
                    <h2 className="text-lg font-medium text-gray-800">
                      {activeTab === 'All' ? 'All Credit Assessment Items' : `${activeTab} Credit Assessment Items`}
                    </h2>
                  </div>
                  
                  <DataTable
                    data={filteredResults}
                    getFieldValue={getFieldValue}
                    getVerificationStatus={getVerificationStatus}
                  />
                </div>
                
                {/* Raw LLM Output Section for Debugging */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                  <div className="border-b border-gray-200 bg-gray-50 p-4 flex justify-between items-center cursor-pointer" 
                       onClick={() => setShowCreditDebug(!showCreditDebug)}>
                    <h2 className="text-lg font-medium text-gray-800">Credit Assessment Debug Data</h2>
                    <span className="text-gray-500">{showCreditDebug ? '▲ Hide' : '▼ Show'}</span>
                  </div>
                  
                  {showCreditDebug && (
                    <div className="p-4 overflow-auto max-h-96">
                      <pre className="text-xs text-gray-700">{JSON.stringify(verificationResults, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {/* Loan Checklist Content */}
            {activeContentTab === 'loanChecklist' && (
              <>
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                  <div className="border-b border-gray-200 bg-gray-50 p-4">
                    <h2 className="text-lg font-medium text-gray-800">Loan Documentation Checklist</h2>
                  </div>
                  
                  {loanChecklistLoading && (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                      <span className="ml-3 text-indigo-500">Loading loan checklist data...</span>
                    </div>
                  )}
                  
                  {loanChecklistError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded m-4">
                      <p className="font-medium">Error loading loan checklist data</p>
                      <p>{loanChecklistError}</p>
                    </div>
                  )}
                  
                  {!loanChecklistLoading && !loanChecklistError && (
                    <div className="p-4">
                      <LoanChecklistTable data={loanChecklistData} />
                    </div>
                  )}
                </div>
                
                {/* Raw Loan Checklist Debug Data */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                  <div className="border-b border-gray-200 bg-gray-50 p-4 flex justify-between items-center cursor-pointer" 
                       onClick={() => setShowLoanChecklistDebug(!showLoanChecklistDebug)}>
                    <h2 className="text-lg font-medium text-gray-800">Loan Checklist Debug Data</h2>
                    <span className="text-gray-500">{showLoanChecklistDebug ? '▲ Hide' : '▼ Show'}</span>
                  </div>
                  
                  {showLoanChecklistDebug && (
                    <div className="p-4 overflow-auto max-h-96">
                      <pre className="text-xs text-gray-700">{rawLoanChecklistOutput || JSON.stringify(loanChecklistData, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {/* AI Insights Content */}
            {activeContentTab === 'aiInsights' && (
              <>
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                  <div className="border-b border-gray-200 bg-gray-50 p-4">
                    <h2 className="text-lg font-medium text-gray-800">AI Insights</h2>
                  </div>
                  
                  {aiInsightsLoading && (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                      <span className="ml-3 text-indigo-500">Analyzing documents for insights...</span>
                    </div>
                  )}
                  
                  {aiInsightsError && !aiInsightsLoading && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded m-4">
                      <p className="font-medium">Error generating AI insights</p>
                      <p>{aiInsightsError}</p>
                    </div>
                  )}
                  
                  {!aiInsightsLoading && !aiInsightsError && (
                    <AIInsightsPanel insights={aiInsights} />
                  )}
                </div>
                
                {/* Raw AI Insights Debug Data */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                  <div className="border-b border-gray-200 bg-gray-50 p-4 flex justify-between items-center cursor-pointer" 
                       onClick={() => setShowAIInsightsDebug(!showAIInsightsDebug)}>
                    <h2 className="text-lg font-medium text-gray-800">AI Insights Debug Data</h2>
                    <span className="text-gray-500">{showAIInsightsDebug ? '▲ Hide' : '▼ Show'}</span>
                  </div>
                  
                  {showAIInsightsDebug && (
                    <div className="p-4 overflow-auto max-h-96">
                      <pre className="text-xs text-gray-700">{rawAiInsightsOutput || JSON.stringify(aiInsights, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {/* CAM Summary Content */}
            {activeContentTab === 'camSummary' && (
              <>
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                  <div className="border-b border-gray-200 bg-gray-50 p-4">
                    <h2 className="text-lg font-medium text-gray-800">CAM Summary</h2>
                  </div>
                  
                  {camSummaryLoading && (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                      <span className="ml-3 text-indigo-500">Generating CAM Summary...</span>
                    </div>
                  )}
                  
                  {camSummaryError && !camSummaryLoading && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded m-4">
                      <p className="font-medium">Error generating CAM Summary</p>
                      <p>{camSummaryError}</p>
                    </div>
                  )}
                  
                  {!camSummaryLoading && !camSummaryError && camSummary && (
                    <div className="p-6 prose prose-indigo max-w-none prose-headings:mb-4 prose-p:my-3 prose-hr:my-5 prose-ul:my-3">
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-indigo-800 pb-2 border-b-2 border-indigo-200 mb-6" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-2xl font-semibold text-indigo-700 mt-8 mb-4 pb-1 border-b border-gray-200" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-xl font-medium text-indigo-600 mt-6 mb-3" {...props} />,
                          p: ({node, ...props}) => <p className="my-3 text-gray-700 leading-relaxed" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-6 my-4 text-gray-700" {...props} />,
                          li: ({node, ...props}) => <li className="mb-2" {...props} />,
                          hr: ({node, ...props}) => <hr className="my-6 border-t-2 border-gray-100" {...props} />
                        }}
                      >
                        {camSummary}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
                
                {/* Raw CAM Summary Debug Data */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                  <div className="border-b border-gray-200 bg-gray-50 p-4 flex justify-between items-center cursor-pointer" 
                       onClick={() => setShowCamSummaryDebug(!showCamSummaryDebug)}>
                    <h2 className="text-lg font-medium text-gray-800">CAM Summary Debug Data</h2>
                    <span className="text-gray-500">{showCamSummaryDebug ? '▲ Hide' : '▼ Show'}</span>
                  </div>
                  
                  {showCamSummaryDebug && (
                    <div className="p-4 overflow-auto max-h-96">
                      <pre className="text-xs text-gray-700">{rawCamSummaryOutput}</pre>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {/* Bottom Action Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Home
              </button>
              <button
                onClick={handleComplete}
                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                disabled={loading || loanChecklistLoading || aiInsightsLoading || camSummaryLoading}
              >
                {loading || loanChecklistLoading || aiInsightsLoading || camSummaryLoading
                  ? 'Processing...'
                  : 'Mark as Complete & Proceed'}
              </button>
            </div>
          </>
        )}
        
        {!loading && (!verificationResults || verificationResults.length === 0) && !error && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500">No verification results available. Please upload documents to verify.</p>
          </div>
        )}
        
        {/* Modal for showing details */}
        {isModalOpen && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-11/12 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Item Details: {selectedItem.field_name}</h2>
                <button onClick={closeModal} className="text-gray-600 hover:text-gray-900">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-bold mb-2">Source Expected</h3>
                  <p className="whitespace-pre-wrap">{selectedItem.Source_to_be_looked_at_in_ocr || "N/A"}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-bold mb-2">Data Found</h3>
                  <p className="whitespace-pre-wrap">{selectedItem.Field_data_found_in_OCR || "N/A"}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-bold mb-2">Source Found</h3>
                  <p className="whitespace-pre-wrap">{selectedItem.Source_found_in_OCR || "N/A"}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-bold mb-2">AI Comments</h3>
                  <p className="whitespace-pre-wrap">{selectedItem.AI_Comments || "N/A"}</p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </AppLayout>
  );
} 