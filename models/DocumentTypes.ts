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
  aiClassifiedType?: string; // Type assigned by AI classification
  classificationConfidence?: number; // Confidence score of classification
  userConfirmedType?: string; // Type confirmed/selected by user
  finalDocumentType?: string; // Final document type after all processing
  userSession?: string; // Session ID for tracking which upload session this document belongs to
  thumbnailUrl?: string; // Path to the file preview thumbnail
  filePath?: string; // Path to the file on disk
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

// Document type constants for business loans
export const businessLoanDocumentTypes = [
  { id: 'pan_card', name: 'PAN Card', description: 'Permanent Account Number card for business identification' },
  { id: 'aadhaar_card', name: 'Aadhaar Card', description: 'Aadhaar identification of business owner or authorized person' },
  { id: 'cibil', name: 'CIBIL Report', description: 'Credit Information Bureau India Limited report' },
  { id: 'itr', name: 'Income Tax Return', description: 'Income Tax Returns for last 2-3 financial years' },
  { id: 'gst', name: 'GST Documents', description: 'Goods and Services Tax registration and returns' },
  { id: 'application_form', name: 'Application Form', description: 'Completed business loan application form' },
  { id: 'electricity_bill', name: 'Electricity Bill', description: 'Recent electricity bill for address verification' },
  { id: 'consent_email', name: 'Consent Email', description: 'Email showing consent for business loan application' },
  { id: 'udyam', name: 'Udyam Registration', description: 'MSME/Udyam registration certificate' },
  { id: 'other', name: 'Other Document', description: 'Any other supporting document for business loan' }
];

// Function to get document type name by ID
export const getDocumentTypeName = (typeId: string, isBusinessLoan = false): string => {
  const docTypes = isBusinessLoan ? businessLoanDocumentTypes : personalLoanDocumentTypes;
  const docType = docTypes.find(type => type.id === typeId);
  return docType ? docType.name : 'Unknown';
};

// Function to get document type by ID
export const getDocumentType = (typeId: string, isBusinessLoan = false) => {
  const docTypes = isBusinessLoan ? businessLoanDocumentTypes : personalLoanDocumentTypes;
  return docTypes.find(type => type.id === typeId);
}; 