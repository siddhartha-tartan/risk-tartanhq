// Simple in-memory store for document data
// In a production app, this would be replaced with a database

import { Document, ProcessingJob, ExtractedData } from '../models/DocumentTypes';

class DocumentStore {
  private static instance: DocumentStore;
  private documents: Document[] = [];
  private jobs: ProcessingJob[] = [];
  private extractedData: ExtractedData[] = [];
  private lastId = 0;

  private constructor() {}

  public static getInstance(): DocumentStore {
    if (!DocumentStore.instance) {
      DocumentStore.instance = new DocumentStore();
    }
    return DocumentStore.instance;
  }

  // Document methods
  public addDocument(document: Omit<Document, 'id'>): Document {
    const newDocument = {
      id: ++this.lastId,
      ...document
    };
    this.documents.push(newDocument);
    return newDocument;
  }

  public getDocuments(): Document[] {
    return [...this.documents];
  }

  public getDocument(id: number): Document | undefined {
    return this.documents.find(doc => doc.id === id);
  }

  public updateDocument(id: number, data: Partial<Document>): Document | undefined {
    const index = this.documents.findIndex(doc => doc.id === id);
    if (index === -1) return undefined;

    this.documents[index] = {
      ...this.documents[index],
      ...data
    };

    return this.documents[index];
  }

  public deleteDocument(id: number): boolean {
    const initialLength = this.documents.length;
    this.documents = this.documents.filter(doc => doc.id !== id);
    return initialLength > this.documents.length;
  }

  public clearDocuments(): void {
    this.documents = [];
  }

  // Job methods
  public createJob(job: Omit<ProcessingJob, 'status'>): ProcessingJob {
    const newJob = {
      ...job,
      status: 'pending' as const
    };
    this.jobs.push(newJob);
    return newJob;
  }

  public getJob(requestId: string): ProcessingJob | undefined {
    return this.jobs.find(job => job.requestId === requestId);
  }

  public updateJob(requestId: string, data: Partial<ProcessingJob>): ProcessingJob | undefined {
    const index = this.jobs.findIndex(job => job.requestId === requestId);
    if (index === -1) return undefined;

    this.jobs[index] = {
      ...this.jobs[index],
      ...data
    };

    return this.jobs[index];
  }

  public clearJobs(): void {
    this.jobs = [];
  }
  
  // Extracted data methods
  public addExtractedData(data: Omit<ExtractedData, 'verificationStatus'>): ExtractedData {
    const newData = {
      ...data,
      verificationStatus: 'pending' as const
    };
    this.extractedData.push(newData);
    return newData;
  }
  
  public getExtractedData(documentId: number): ExtractedData | undefined {
    return this.extractedData.find(data => data.documentId === documentId);
  }
  
  public updateExtractedData(documentId: number, data: Partial<ExtractedData>): ExtractedData | undefined {
    const index = this.extractedData.findIndex(item => item.documentId === documentId);
    if (index === -1) return undefined;
    
    this.extractedData[index] = {
      ...this.extractedData[index],
      ...data
    };
    
    return this.extractedData[index];
  }

  // Add verification results
  verificationResults: any[] | null = null;
  
  setVerificationResults(results: any[] | null) {
    this.verificationResults = results;
    console.log('Verification results stored:', results);
  }
  
  getVerificationResults() {
    return this.verificationResults;
  }
}

// Export singleton instance
export const documentStore = DocumentStore.getInstance(); 