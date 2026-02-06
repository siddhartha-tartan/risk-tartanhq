'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import AppLayout from '../components/AppLayout';
import Card from '../components/Card';
import Button from '../components/Button';

export default function BusinessUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const router = useRouter();

  // Single file drop handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Reset any previous errors
    setError('');
    
    // Only accept one file
    const selectedFile = acceptedFiles[0];
    
    // Check if it's a zip file
    if (selectedFile && selectedFile.type === 'application/zip') {
      setFile(selectedFile);
    } else {
      setError('Please upload a valid zip file.');
    }
  }, []);

  // Dropzone for single file
  const { 
    getRootProps, 
    getInputProps, 
    isDragActive 
  } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
    },
    maxFiles: 1,
  });

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      // Create a FormData instance to send the file
      const formData = new FormData();
      formData.append('zipFile', file);
      formData.append('documentType', 'business'); // Add document type to distinguish from personal

      // Simulate small progress increase to show initial activity
      setUploadProgress(5);

      // Start a progress simulation for UI feedback
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + (Math.random() * 3); // Slow random progress
        });
      }, 300);

      // Call the API route to upload the file to S3
      const response = await fetch('/api/documents/upload-zip', {
        method: 'POST',
        body: formData,
      });

      // Clear the progress simulation
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error uploading file');
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      
      // Set progress to 100% for completion
      setUploadProgress(100);

      // Process the file with OCR API
      setTimeout(() => {
        // Navigate to the processing page with the S3 key
        router.push(`/processing?s3Key=${encodeURIComponent(result.s3Key)}&docType=business`);
      }, 1000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An error occurred during upload');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-blue/10 rounded-2xl mb-6">
              <svg className="w-8 h-8 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Business Document Upload</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload your business documents in a ZIP file for automated compliance verification
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Card variant="outline" className="mb-6 border-red-200 bg-red-50">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Area */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                    isDragActive 
                      ? 'border-brand-500 bg-brand-50' 
                      : file 
                        ? 'border-accent-emerald bg-emerald-50' 
                        : 'border-gray-300 hover:border-brand-400 hover:bg-brand-50/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="space-y-6">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
                      file ? 'bg-accent-emerald/10' : 'bg-gray-100'
                    }`}>
                      {file ? (
                        <svg className="w-10 h-10 text-accent-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {file ? file.name : 'Drop your ZIP file here'}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {file 
                          ? `File size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`
                          : 'or click to browse files'
                        }
                      </p>
                      <div className="text-sm text-gray-500">
                        <p>Include PAN card, Aadhaar card, CIBIL, ITR, GST, and other required business documents</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">Uploading documents...</span>
                      <span className="text-sm font-medium text-brand-600">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-brand-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Securely transferring business documents for compliance verification...
                    </p>
                  </div>
                )}

                {/* Upload Button */}
                {file && !uploading && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <Button 
                      size="lg" 
                      className="w-full"
                      onClick={handleUpload}
                      rightIcon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      }
                    >
                      Begin Business Verification Process
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            {/* Info Panel */}
            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Requirements</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-accent-emerald mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">ZIP files only</p>
                      <p className="text-xs text-gray-500">Maximum 100MB per file</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-accent-emerald mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Secure processing</p>
                      <p className="text-xs text-gray-500">Bank-grade encryption</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-accent-emerald mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">No password protection</p>
                      <p className="text-xs text-gray-500">Files must be accessible</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Time</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Document extraction</span>
                    <span className="text-sm font-medium text-gray-900">~2 min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">AI verification</span>
                    <span className="text-sm font-medium text-gray-900">~3 min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Compliance check</span>
                    <span className="text-sm font-medium text-gray-900">~2 min</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Total time</span>
                      <span className="text-sm font-semibold text-brand-600">~7 min</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8 flex justify-start">
            <Button 
              variant="secondary" 
              onClick={() => router.push('/business-disclaimer')}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              }
            >
              Back to Requirements
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 