import React, { useState } from 'react';

interface LoanChecklistPanelProps {
  data?: any[];
  rawData?: string;
}

const LoanChecklistPanel: React.FC<LoanChecklistPanelProps> = ({ 
  data = [], 
  rawData = ''
}) => {
  const [showRawData, setShowRawData] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 p-4 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-800">Loan Checklist</h2>
        {rawData && (
          <button 
            onClick={() => setShowRawData(!showRawData)}
            className="text-sm px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
          >
            {showRawData ? 'Hide Raw Data' : 'Show Raw Data'}
          </button>
        )}
      </div>
      
      {showRawData ? (
        <div className="p-4 overflow-auto max-h-[600px]">
          <pre className="text-xs text-gray-700">{rawData}</pre>
        </div>
      ) : (
        <div className="p-4 overflow-auto max-h-[600px]">
          {data && data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Checkpoints
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Matching Documents
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.Category || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item['Document (to check from)'] || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item['Checkpoints (what to check from documents)'] || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item['Matching Documents (to be checked by AI), (below filled is dummy data)'] || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.Applicant === 'Yes' ? 'bg-green-100 text-green-800' : 
                          item.Applicant === 'No' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.Applicant || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center justify-center">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3.586l2.707 2.707a1 1 0 01-1.414 1.414l-3-3A1 1 0 019 10V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <h3 className="text-xl font-medium text-gray-500 mb-2">No Checklist Data Available</h3>
              <p className="text-gray-400">Please upload loan documents to see the checklist.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoanChecklistPanel; 