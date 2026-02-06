'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import AppLayout from '@/app/components/AppLayout';

export default function UploadPage() {
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
        router.push(`/processing?s3Key=${encodeURIComponent(result.s3Key)}`);
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
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Document Upload</h1>
            <p className="text-gray-600">
              Upload your financial records in a ZIP file for automated compliance verification
            </p>
          </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          {error && (
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}

          {/* Upload UI */}
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <div className="text-lg font-medium text-gray-900">
                {file ? file.name : 'Drag and drop client documents ZIP file here'}
              </div>
              <p className="text-sm text-gray-500">
                Include financial statements, tax documents, and income verification files in a single ZIP package
              </p>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Uploading...</span>
                <span className="text-sm font-medium text-gray-700">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Securely transferring financial documents for compliance verification...
              </p>
            </div>
          )}

          {file && !uploading && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Selected file:</span>
                <span className="text-sm text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleUpload}
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Begin Verification Process
                </button>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
    </AppLayout>
  );
} 