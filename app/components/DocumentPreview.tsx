'use client';

import React from 'react';

interface DocumentPreviewProps {
  documentUrl?: string;
  documentType: string;
  isLoading?: boolean;
}

export default function DocumentPreview({
  documentUrl,
  documentType,
  isLoading = false,
}: DocumentPreviewProps) {
  // Different placeholder displays based on document type
  const getPlaceholderContent = () => {
    switch (documentType) {
      case 'invoice':
        return (
          <div className="space-y-4">
            <div className="flex justify-between">
              <div className="h-8 w-32 bg-gray-200 rounded"></div>
              <div className="h-8 w-24 bg-gray-200 rounded"></div>
            </div>
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
            </div>
            <div className="h-24 bg-gray-100 rounded-lg border-2 border-gray-200"></div>
            <div className="flex justify-end">
              <div className="h-8 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        );

      case 'medical_form':
        return (
          <div className="space-y-4">
            <div className="h-8 w-40 mx-auto bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-6 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
            <div className="h-32 bg-gray-100 rounded-lg border-2 border-gray-200"></div>
            <div className="grid grid-cols-3 gap-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        );

      case 'contract':
        return (
          <div className="space-y-3">
            <div className="h-8 w-40 mx-auto bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
            <div className="mt-8 flex justify-between">
              <div className="h-12 w-24 bg-gray-200 rounded"></div>
              <div className="h-12 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="h-8 w-40 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-100 rounded"></div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden h-full flex flex-col">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Document Preview</h3>
        <p className="mt-1 text-sm text-gray-500">
          {documentType.charAt(0).toUpperCase() + documentType.slice(1)}
        </p>
      </div>

      <div className="flex-grow p-4 overflow-auto">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-middle"></div>
            <span className="ml-2 text-gray-600">Loading document...</span>
          </div>
        ) : documentUrl ? (
          // Real document display would go here - using an iframe for PDFs or img for images
          // For now we'll just show a placeholder
          <div className="text-center text-gray-500">
            <p className="mb-4">Document would be displayed here</p>
            <div className="h-full w-full rounded-md border-2 border-dashed border-gray-300 p-12">
              {getPlaceholderContent()}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>No document selected</p>
          </div>
        )}
      </div>
    </div>
  );
} 