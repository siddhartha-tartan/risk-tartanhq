'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../components/AppLayout';
import Card from '../components/Card';
import Button from '../components/Button';

export default function BusinessDisclaimerPage() {
  const [acknowledged, setAcknowledged] = useState(false);
  const router = useRouter();

  const handleContinue = () => {
    // Navigate to the business document upload page when acknowledged
    router.push('/business-upload');
  };

  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-blue/10 rounded-2xl mb-6">
              <svg className="w-8 h-8 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Business Loan Document Requirements</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Please review the following requirements before uploading business loan documents
            </p>
          </div>

          {/* Important Information Card */}
          <Card className="mb-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Important Information
                </h2>
                
                <div className="space-y-6">
                  <Card variant="filled" padding="sm">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-accent-blue mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Data Processing Notice</h3>
                        <p className="text-sm text-gray-600">
                          Your business documents will be processed using advanced AI technology for accurate data extraction and analysis. All data is encrypted and handled according to industry security standards.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </Card>

          {/* Required Documents */}
          <Card className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Required Documents</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center">
                  <svg className="w-5 h-5 text-accent-emerald mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Financial Documents
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 ml-7">
                  <li>• Balance Sheet (Latest 3 years)</li>
                  <li>• Profit & Loss Statement</li>
                  <li>• Cash Flow Statement</li>
                  <li>• Tax Returns (Latest 3 years)</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center">
                  <svg className="w-5 h-5 text-accent-emerald mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Business Documents
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 ml-7">
                  <li>• Business Registration Certificate</li>
                  <li>• Articles of Incorporation</li>
                  <li>• Business License</li>
                  <li>• Bank Statements (Latest 12 months)</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Upload Guidelines */}
          <Card className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload Guidelines</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Supported Formats</h3>
                <p className="text-sm text-gray-600">PDF, JPG, PNG files up to 50MB each</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Quality Requirements</h3>
                <p className="text-sm text-gray-600">Clear, legible documents with good resolution</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Security</h3>
                <p className="text-sm text-gray-600">Bank-grade encryption and secure processing</p>
              </div>
            </div>
          </Card>

          {/* Acknowledgment */}
          <Card className="mb-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                <input
                  type="checkbox"
                  id="acknowledge"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 focus:ring-2"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="acknowledge" className="text-sm text-gray-700 cursor-pointer">
                  I understand and agree to the document processing requirements listed above. I confirm that all documents to be uploaded are authentic and belong to my business entity.
                </label>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button 
              variant="secondary" 
              onClick={() => router.push('/')}
            >
              Back to Home
            </Button>
            <Button 
              onClick={handleContinue}
              disabled={!acknowledged}
              rightIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              }
            >
              Continue to Upload
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 