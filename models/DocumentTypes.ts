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

// Document type constants for personal loans
export const personalLoanDocumentTypes = [
  { id: 'identity_proof', name: 'Identity Proof', description: 'Proof of identity such as Aadhar Card, PAN Card, Passport, Voter ID' },
  { id: 'address_proof', name: 'Address Proof', description: 'Proof of residence like utility bills, rental agreement, property tax receipt' },
  { id: 'income_proof', name: 'Income Proof', description: 'Salary slips, Form 16, ITR for last 2 years, bank statements' },
  { id: 'photo', name: 'Photograph', description: 'Recent passport-sized photograph' },
  { id: 'employment_proof', name: 'Employment Proof', description: 'Employment certificate, appointment letter, business registration' },
  { id: 'bank_statement', name: 'Bank Statement', description: 'Last 6 months bank statement showing income credits' },
  { id: 'loan_application', name: 'Loan Application', description: 'Completed loan application form' },
  { id: 'property_documents', name: 'Property Documents', description: 'For secured loans, documents of the property being mortgaged' },
  { id: 'other', name: 'Other Document', description: 'Any other supporting document' }
];

// Function to get document type name by ID
export const getDocumentTypeName = (typeId: string): string => {
  const docType = personalLoanDocumentTypes.find(type => type.id === typeId);
  return docType ? docType.name : 'Unknown';
};

// Function to get document type by ID
export const getDocumentType = (typeId: string) => {
  return personalLoanDocumentTypes.find(type => type.id === typeId);
}; 