/**
 * Document Types Definitions
 * 
 * This file contains the type definitions for documents and related objects
 * as mentioned in the project plan.
 */

export interface User {
  id: string;
  username: string;
  password?: string; // Only used during authentication
  sessionInfo?: {
    lastLogin: Date;
    expiresAt: Date;
  };
}

export interface Document {
  id: number;
  userId?: string; // Owner
  originalFilename: string;
  fileType: string; // PDF, JPG, PNG
  filetype?: string; // MIME type (application/pdf, image/jpeg, etc.)
  documentType: string; // Invoice, contract, medical_form, etc.
  uploadTimestamp: Date;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  s3StorageReference?: string; // For original zip
  localStorageReference?: string; // For preview
  ocrText?: string;
  errorInfo?: string;
}

export interface ExtractedData {
  documentId: number;
  rawOcrText: string;
  structuredData: any; // Dynamic schema per document
  verificationStatus: 'pending' | 'approved' | 'rejected';
}

// Additional interfaces for form field definitions
export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'checkbox' | 'textarea' | 'select' | 'table';
  value: any;
  options?: { value: string; label: string }[]; // For select fields
  columns?: { id: string; label: string; type: string }[]; // For table fields
  rows?: any[]; // For table fields
  required?: boolean;
  validation?: RegExp;
  parent?: string; // For nested fields
  nested?: FormField[]; // For fields that have nested sub-fields
}

// Processing job interface
export interface ProcessingJob {
  requestId: string;
  s3Key: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  documents?: Document[];
  error?: string;
}

// Document type options
export const DOCUMENT_TYPES = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'medical_form', label: 'Medical Form' },
  { value: 'contract', label: 'Contract' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'id_card', label: 'ID Card' },
  { value: 'insurance', label: 'Insurance Document' },
  { value: 'letter', label: 'Letter' },
  { value: 'other', label: 'Other' }
]; 