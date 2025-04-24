import React, { useState } from 'react';

interface Insight {
  title: string;
  description: string;
  type: 'info' | 'warning' | 'error';
  relatedDocuments?: string[];
}

interface AIInsightsPanelProps {
  insights: Insight[];
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ insights }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'info' | 'warning' | 'error'>('all');
  
  // Count insights by type
  const countByType = {
    all: insights.length,
    info: insights.filter(insight => insight.type === 'info').length,
    warning: insights.filter(insight => insight.type === 'warning').length,
    error: insights.filter(insight => insight.type === 'error').length
  };
  
  // Filter insights based on active tab
  let filteredInsights = activeTab === 'all' 
    ? insights 
    : insights.filter(insight => insight.type === activeTab);
  
  // Sort insights in 'all' tab by priority: error -> warning -> info
  if (activeTab === 'all') {
    filteredInsights = [
      ...insights.filter(insight => insight.type === 'error'),
      ...insights.filter(insight => insight.type === 'warning'),
      ...insights.filter(insight => insight.type === 'info')
    ];
  }
  
  // Function to get the appropriate icon based on insight type
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3.586l2.707 2.707a1 1 0 01-1.414 1.414l-3-3A1 1 0 019 10V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Function to get text color based on insight type
  const getInsightTextColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'text-blue-700';
      case 'warning':
        return 'text-yellow-700';
      case 'error':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  // Function to get tab styles
  const getTabStyles = (tabName: 'all' | 'info' | 'warning' | 'error') => {
    const baseStyles = "px-4 py-2 text-sm font-medium rounded-t-lg";
    const activeStyles = "bg-white border-t border-l border-r border-gray-200 text-blue-600";
    const inactiveStyles = "bg-gray-100 text-gray-600 hover:text-gray-800 hover:bg-gray-200";
    
    return `${baseStyles} ${activeTab === tabName ? activeStyles : inactiveStyles}`;
  };
  
  // Function to get badge styles for count
  const getCountBadgeStyles = (type: 'all' | 'info' | 'warning' | 'error') => {
    switch (type) {
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get the display name for the error tab (renamed to "Needs Attention")
  const getTypeDisplayName = (type: string) => {
    return type === 'error' ? 'Needs Attention' : type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (!insights || insights.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3.586l2.707 2.707a1 1 0 01-1.414 1.414l-3-3A1 1 0 019 10V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        <h3 className="text-xl font-medium text-gray-500 mb-2">No Insights Available</h3>
        <p className="text-gray-400">No insights were generated from the analyzed documents.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('all')}
          className={getTabStyles('all')}
        >
          All
          <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${getCountBadgeStyles('all')}`}>
            {countByType.all}
          </span>
        </button>
        
        {countByType.info > 0 && (
          <button
            onClick={() => setActiveTab('info')}
            className={getTabStyles('info')}
          >
            <div className="flex items-center">
              {getInsightIcon('info')}
              <span className="ml-1">Info</span>
              <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${getCountBadgeStyles('info')}`}>
                {countByType.info}
              </span>
            </div>
          </button>
        )}
        
        {countByType.warning > 0 && (
          <button
            onClick={() => setActiveTab('warning')}
            className={getTabStyles('warning')}
          >
            <div className="flex items-center">
              {getInsightIcon('warning')}
              <span className="ml-1">Warning</span>
              <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${getCountBadgeStyles('warning')}`}>
                {countByType.warning}
              </span>
            </div>
          </button>
        )}
        
        {countByType.error > 0 && (
          <button
            onClick={() => setActiveTab('error')}
            className={getTabStyles('error')}
          >
            <div className="flex items-center">
              {getInsightIcon('error')}
              <span className="ml-1">Needs Attention</span>
              <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${getCountBadgeStyles('error')}`}>
                {countByType.error}
              </span>
            </div>
          </button>
        )}
      </div>
      
      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.map((insight, index) => (
          <div 
            key={index} 
            className="overflow-hidden bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className={`px-4 py-3 border-l-4 ${
              insight.type === 'info' 
                ? 'border-l-blue-500 bg-blue-50' 
                : insight.type === 'warning'
                  ? 'border-l-yellow-500 bg-yellow-50'
                  : 'border-l-red-500 bg-red-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {getInsightIcon(insight.type)}
                  </div>
                  <h3 className={`ml-2 text-md font-semibold ${getInsightTextColor(insight.type)}`}>
                    {insight.title}
                  </h3>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                  insight.type === 'info' 
                    ? 'bg-blue-100 text-blue-800' 
                    : insight.type === 'warning'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}>
                  {getTypeDisplayName(insight.type)}
                </span>
              </div>
            </div>
            <div className="px-5 py-4 bg-white">
              <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {insight.description}
              </div>
              
              {insight.relatedDocuments && insight.relatedDocuments.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <h4 className="text-xs font-medium text-gray-500 mb-2">Related Documents:</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {insight.relatedDocuments.map((doc, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIInsightsPanel; 