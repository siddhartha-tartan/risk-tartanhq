import React from 'react';

interface LoanChecklistTableProps {
  data: any[];
}

const LoanChecklistTable: React.FC<LoanChecklistTableProps> = ({ data }) => {
  // Get status based on the "Data Entry Matching" field
  const getStatus = (item: any) => {
    const matching = item["Data Entry Matching (Answer Yes or No)"];
    if (!matching) return "Pending";
    return matching.toLowerCase() === "yes" ? "Verified" : "Not Verified";
  };

  // Calculate if application is First Time Right (FTR) or First Time Not Right (FTNR)
  const calculateFTRStatus = () => {
    if (!data || data.length === 0) return { status: 'Pending', message: 'Pending verification' };
    
    // Filter for mandatory items
    const mandatoryItems = data.filter(item => 
      item.Applicant && item.Applicant.toLowerCase() === 'mandatory'
    );
    
    if (mandatoryItems.length === 0) return { status: 'Pending', message: 'No mandatory items found' };
    
    // Check if any mandatory item has "Data Entry Matching" as "No"
    const notVerifiedItems = mandatoryItems.filter(item => {
      const matching = item["Data Entry Matching (Answer Yes or No)"];
      return matching && matching.toLowerCase() === 'no';
    });
    
    if (notVerifiedItems.length > 0) {
      return { 
        status: 'FTNR', 
        message: 'First Time Not Right', 
        count: `${notVerifiedItems.length} of ${mandatoryItems.length} mandatory items not verified`
      };
    } else {
      return { 
        status: 'FTR', 
        message: 'First Time Right', 
        count: `All ${mandatoryItems.length} mandatory items verified`
      };
    }
  };
  
  const ftrStatus = calculateFTRStatus();

  return (
    <div>
      {/* FTR/FTNR Status Display */}
      <div className={`mb-4 p-3 rounded-md flex items-center ${
        ftrStatus.status === 'FTR' 
          ? 'bg-green-50 border border-green-200' 
          : ftrStatus.status === 'FTNR'
            ? 'bg-red-50 border border-red-200'
            : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
          ftrStatus.status === 'FTR' 
            ? 'bg-green-100 text-green-800' 
            : ftrStatus.status === 'FTNR'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
        }`}>
          {ftrStatus.status === 'FTR' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : ftrStatus.status === 'FTNR' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div>
          <h3 className={`font-medium ${
            ftrStatus.status === 'FTR' 
              ? 'text-green-800' 
              : ftrStatus.status === 'FTNR'
                ? 'text-red-800'
                : 'text-yellow-800'
          }`}>
            {ftrStatus.message}
          </h3>
          <p className="text-sm text-gray-600">{ftrStatus.count}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Category</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Document</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Status</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Matching Documents</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Comments</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data && data.length > 0 ? (
              data.map((item, index) => (
                <tr 
                  key={index}
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 ${
                    item.Applicant && item.Applicant.toLowerCase() === 'mandatory' ? 'font-medium' : ''
                  }`}
                >
                  <td className="px-3 py-2 text-sm text-gray-900">
                    {item.Categories || "N/A"}
                    {item["Subcategory (if applicable)"] && item["Subcategory (if applicable)"] !== "no subcat" && (
                      <span className="block text-xs text-gray-500 mt-1">
                        {item["Subcategory (if applicable)"]}
                      </span>
                    )}
                    {item.Applicant && item.Applicant.toLowerCase() === 'mandatory' && (
                      <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full ml-1">
                        Mandatory
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600 truncate max-w-xs">
                    {item.Document || "N/A"}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      getStatus(item) === 'Verified' ? 'bg-green-100 text-green-800' :
                      getStatus(item) === 'Not Verified' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getStatus(item)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600">
                    {item["Matching Documents"] || "N/A"}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600 break-words max-w-xs">
                    {item["AI Comments (reasoning behind decision)"] || "No comments available"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-3 py-2 text-sm text-center text-gray-500">
                  No checklist items available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LoanChecklistTable; 