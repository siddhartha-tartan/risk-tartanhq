# Document Processing Application

A Next.js application for uploading, processing, and extracting structured data from documents using OCR and LLM.

## Features

- Upload zip files containing multiple documents (PDF, JPG, PNG)
- Process documents through an external OCR API
- Extract structured data using LLM
- Review and modify extracted information
- Approve or reject results

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd document-processor
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/app` - Next.js application pages and components
  - `/api` - API routes for backend functionality
  - `/components` - Reusable UI components
  - `/login` - Authentication page
  - `/upload` - ZIP file upload interface
  - `/processing` - Processing status page
  - `/document-mapping` - Document type assignment
  - `/llm-processing` - LLM extraction progress
  - `/document-review` - Document review and editing interface
  - `/complete` - Process completion page
- `/models` - Data models
- `/utils` - Utility functions

## Workflow

1. **Login**: Enter credentials (mock auth for demo)
2. **Upload**: Upload a ZIP file containing documents
3. **Processing**: Documents are processed through OCR
4. **Document Mapping**: Assign document types to each file
5. **LLM Processing**: Extract structured data from OCR text
6. **Document Review**: Review and edit extracted information
7. **Completion**: Process is complete, view summary

## Mock Credentials

For demo purposes, use the following credentials:
- Username: `admin`
- Password: `password`

## Demo Mode - Experience All 4 LLMs

To see the complete personal loan analysis system in action without requiring external API calls:

1. **Download the Demo File**: Visit the upload page and download `goutam.zip`
2. **Upload the File**: Upload `goutam.zip` to the system
3. **Experience the Full Workflow**: The system will demonstrate all 4 LLMs working together:
   - **GPT-4o-mini**: Advanced document data extraction
   - **o3-mini**: Comprehensive business document analysis  
   - **o3-mini**: AI-powered risk insights generation
   - **o3-mini**: Credit Assessment Memo (CAM) creation

### Demo Features

- ✅ **Real OCR Data**: Uses actual OCR text from genuine documents
- ✅ **High-Quality Mock LLM Responses**: Realistic, comprehensive analysis results
- ✅ **Complete Workflow**: Experience all stages from upload to final recommendations
- ✅ **No API Costs**: Skip expensive LLM API calls during demonstrations
- ✅ **Instant Processing**: No waiting for external API responses
- ✅ **Realistic Results**: Shows exactly how the system works with real data

### What the Demo Shows

1. **Document Analysis**: Complete breakdown of PAN card, salary slips, bank statements, CIBIL report, rent agreement, and increment letter
2. **Risk Assessment**: Detailed insights including credit profile analysis, income verification, and potential red flags
3. **Loan Decision**: Full CAM summary with approval recommendation, risk rating, and specific loan conditions
4. **Compliance Verification**: Comprehensive checklist verification against lending standards

Perfect for demonstrations, training, and understanding the system's capabilities!

## Technologies Used

- **Frontend**: Next.js, React, Tailwind CSS
- **State Management**: React Hooks and Context
- **File Handling**: React Dropzone
- **UI Components**: Custom components with Tailwind
- **Form Builder**: Dynamic form generation based on extracted data

## Project Overview
This application allows users to upload a zip file containing multiple documents (PDF, JPG, PNG). The zip file is stored in AWS S3, processed through an external OCR API, then structured data is extracted using LLMs, and users can review/confirm the extracted information before proceeding.

For the detailed plan, phases, data models, and API endpoints, please refer to `PROJECT_PLAN.md`.

## Key References
- **Detailed Implementation Phases**: See [Implementation Phases](PROJECT_PLAN.md#implementation-phases) in the Project Plan
- **Data Models**: See [Data Models](PROJECT_PLAN.md#data-models) in the Project Plan
- **API Endpoints**: See [API Endpoints](PROJECT_PLAN.md#api-endpoints) in the Project Plan
- **Component Library**: See [Component Library](PROJECT_PLAN.md#component-library) in the Project Plan
- **Implementation Details**: See [Implementation Details](PROJECT_PLAN.md#implementation-details) for S3 and OCR API code

## System Architecture
```
┌─────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (Next.js)                            │
├───────────┬───────────┬───────────────┬────────────────┬────────────────┤
│  Login    │ Zip File  │  Processing   │  Document      │  Dynamic Data  │
│  Screen   │ Uploader  │  Screen       │  Preview       │  Form Editor   │
└───────────┴─────┬─────┴───────┬───────┴────────┬───────┴────────┬───────┘
                  │             │                │                 │
                  ▼             ▼                ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Next.js API Routes)                     │
├───────────┬───────────┬───────────────┬────────────────┬────────────────┤
│  Auth     │ S3        │  External     │  LLM Data      │  Document      │
│  Service  │ Integration│  OCR API     │  Extraction    │  Verification  │
└─────┬─────┴─────┬─────┴───────┬───────┴────────┬───────┴────────┬───────┘
      │           │             │                │                 │
      ▼           ▼             ▼                ▼                 ▼
┌─────────┐ ┌───────────┐ ┌───────────┐  ┌────────────┐  ┌────────────────┐
│MongoDB  │ │AWS S3     │ │OCR API    │  │LLM         │  │Adaptive Form   │
│(metadata)│ │(zip files)│ │Integration│  │API         │  │Generator       │
└─────────┘ └───────────┘ └───────────┘  └────────────┘  └────────────────┘
```

## Workflow Diagram
```
Document Processing Application - Workflow

START
  │
  ▼
[AUTHENTICATION]
  │ Login with credentials
  │ Session management
  │
  ▼
[ZIP FILE UPLOAD]
  │ ┌─────────────────────────────────┐
  │ │ 1. Upload zip file containing   │
  │ │    multiple documents           │
  │ │ 2. Validate zip file            │
  │ │ 3. Show upload progress using   │
  │ │    tqdm as zip uploads to S3    │
  │ └─────────────────────────────────┘
  │
  ▼
[BACKEND PROCESSING]
  │ ┌─────────────────────────────────┐
  │ │ 1. Submit S3 bucket and key to  │
  │ │    OCR API                      │
  │ │ 2. Authenticate with API using  │
  │ │    provided credentials         │
  │ │ 3. Show loader (no percentage)  │
  │ │ 4. Receive OCR response with    │
  │ │    filename-to-text mapping     │
  │ │ 5. Extract files locally for    │
  │ │    preview                      │
  │ └─────────────────────────────────┘
  │
  ▼
[DOCUMENT TYPE MAPPING]
  │ ┌─────────────────────────────────┐
  │ │ 1. Present list of files from   │
  │ │    API response                 │
  │ │ 2. User selects document type   │
  │ │    for each file                │
  │ │ 3. Confirm selections           │
  │ └─────────────────────────────────┘
  │
  ▼
[LLM PROCESSING]
  │ ┌─────────────────────────────────┐
  │ │ 1. Process OCR text with LLM    │
  │ │ 2. Extract structured data      │
  │ │ 3. Status indicators            │
  │ │ 4. Error handling               │
  │ └─────────────────────────────────┘
  │
  ▼
[DOCUMENT REVIEW]
  │ ┌─────────────────────────────────┐
  │ │ 1. Split view interface:        │
  │ │    - Original document (left)   │
  │ │    - Dynamic form-based         │
  │ │      data editor (right)        │
  │ │ 2. User-friendly data editing   │
  │ │    with adaptive UI based on    │
  │ │    document structure           │
  │ │ 3. Navigate between documents   │
  │ └─────────────────────────────────┘
  │
  ▼
[USER DECISION]
  │
  ├──► [APPROVE] ───┐
  │                 │
  ├──► [REJECT] ────┤
  │    Return to    │
  │    processing   │
  │                 │
  └──► [EDIT] ──────┘
       Return to
       document review
  │
  ▼
[MORE DOCUMENTS?]
  │
  ├──► [YES] ─────► Return to Document Review
  │
  └──► [NO]
       │
       ▼
     [COMPLETE] 
```

## Data Flow

### Process Flow
```
┌──────────────────┐     ┌───────────────┐     ┌───────────────┐
│                  │     │               │     │               │
│  User uploads    │────▶│ Backend       │────▶│ AWS S3        │
│  ZIP file        │     │ with progress │     │ Storage       │
│                  │     │               │     │               │
└──────────────────┘     └───────────────┘     └───────┬───────┘
                                                       │
                                                       │
                                                       ▼
┌──────────────────┐     ┌───────────────┐     ┌───────────────┐
│                  │     │               │     │               │
│  Document Type   │◀────│ Backend       │◀────│ External OCR  │
│  Mapping by User │     │ stores OCR    │     │ API processes │
│                  │     │ results       │     │ from S3       │
└────────┬─────────┘     └───────────────┘     └───────────────┘
         │
         │
         ▼
┌──────────────────┐     ┌───────────────┐
│                  │     │               │
│  LLM processes   │────▶│ Structured    │
│  OCR text        │     │ data extracted│
│                  │     │               │
└──────────────────┘     └───────┬───────┘
                                 │
                                 │
                                 ▼
┌──────────────────┐     ┌───────────────┐     ┌───────────────┐
│                  │     │               │     │               │
│  Dynamic Form    │────▶│ User reviews  │────▶│ User approves │
│  Generation      │     │ and edits     │     │ or rejects    │
│                  │     │               │     │               │
└──────────────────┘     └───────────────┘     └───────────────┘
```

### Storage Flow
```
┌──────────────────┐     ┌───────────────────────┐     
│                  │     │                       │     
│  ZIP File        │────▶│  AWS S3 Storage       │     
│                  │     │  (Zip Files)          │     
└──────────────────┘     └───────────┬───────────┘     
                                     │
                                     ▼
┌──────────────────┐     ┌───────────────────────┐     
│                  │     │                       │     
│  Extracted       │────▶│  Local Storage        │     
│  Files           │     │  (For Preview)        │     
└──────────────────┘     └───────────────────────┘     

┌──────────────────┐     ┌───────────────────────┐     
│                  │     │                       │     
│  Metadata        │────▶│  MongoDB              │     
│  (File info,     │     │  (Document metadata,  │     
│   Processing     │     │   User selections)    │     
│   status)        │     │                       │     
└──────────────────┘     └───────────────────────┘     

┌──────────────────┐     ┌───────────────────────┐     
│                  │     │                       │     
│  Extracted       │────▶│  MongoDB              │     
│  Structured      │     │  (JSON data with      │     
│  Data            │     │   user edits)         │     
└──────────────────┘     └───────────────────────┘     
```

### API Integration Flow
```
┌──────────────────┐     ┌───────────────────────┐     
│                  │     │                       │     
│  Frontend        │────▶│  Backend API Route    │     
│  Zip Upload      │     │                       │     
└──────────────────┘     └───────────┬───────────┘     
                                     │
                                     ▼
┌──────────────────┐     ┌───────────────────────┐     
│  AWS S3          │◀────┤  S3 Upload            │     
│  (boto3)         │     │  (with progress)      │     
└────────┬─────────┘     └───────────────────────┘     
         │
         ▼
┌──────────────────┐     ┌───────────────────────┐     
│  OCR API         │◀────┤  API Request          │     
│  Endpoint        │     │  (S3 bucket & key)    │     
└────────┬─────────┘     └───────────────────────┘     
         │
         ▼
┌──────────────────┐
│  OCR Response    │
│  (filename →     │
│   OCR text map)  │
└──────────────────┘
```

## User Interface Examples

### Document Type Mapping Interface
```
┌─────────────────────────────────────────────────────────────┐
│ DOCUMENT TYPE ASSIGNMENT                                    │
├───────────────────────┬─────────────────┬──────────────────┤
│ Filename              │ Document Preview │ Document Type    │
├───────────────────────┼─────────────────┼──────────────────┤
│ invoice_march.pdf     │ [Thumbnail]      │ [Invoice      ▼] │
│ patient_record_12.pdf │ [Thumbnail]      │ [Medical Form ▼] │
│ receipt_office.pdf    │ [Thumbnail]      │ [Receipt      ▼] │
│ contract_2023.pdf     │ [Thumbnail]      │ [Contract     ▼] │
└───────────────────────┴─────────────────┴──────────────────┘
                                    [CONTINUE]
```

### Dynamic Form Editor Examples

**Invoice Document**
```
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│                                 │  │ INVOICE DETAILS                 │
│                                 │  │                                 │
│                                 │  │ Invoice Number: [ABC-12345    ] │
│                                 │  │ Date: [04/15/2023          ▼]  │
│                                 │  │                                 │
│     [PDF DOCUMENT PREVIEW]      │  │ Vendor Information:            │
│                                 │  │   Name: [Acme Supplies Inc.   ] │
│                                 │  │   Tax ID: [123-45-6789        ] │
│                                 │  │                                 │
│                                 │  │ + Add Vendor Field             │
│                                 │  │                                 │
│                                 │  │ Line Items:                    │
│                                 │  │ ┌───────────┬───────┬─────────┐ │
│                                 │  │ │Description│Quantity│ Amount │ │
│                                 │  │ ├───────────┼───────┼─────────┤ │
│                                 │  │ │Widget A   │   5   │ $250.00 │ │
│                                 │  │ │Widget B   │   2   │ $120.00 │ │
│                                 │  │ │Service    │   1   │ $75.00  │ │
│                                 │  │ └───────────┴───────┴─────────┘ │
│                                 │  │                                 │
│                                 │  │ + Add Line Item                │
│                                 │  │                                 │
│                                 │  │ Total: $445.00                 │
└─────────────────────────────────┘  └─────────────────────────────────┘
```

**Medical Record Document**
```
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│                                 │  │ PATIENT INFORMATION             │
│                                 │  │                                 │
│                                 │  │ Patient Name: [John Smith      ] │
│                                 │  │ DOB: [05/12/1980           ▼]  │
│                                 │  │ Patient ID: [PT-78901         ] │
│                                 │  │                                 │
│     [PDF DOCUMENT PREVIEW]      │  │ Vital Signs:                   │
│                                 │  │   Temperature: [98.6°F        ] │
│                                 │  │   Blood Pressure: [120/80     ] │
│                                 │  │   Pulse: [72                  ] │
│                                 │  │                                 │
│                                 │  │ Diagnosis:                     │
│                                 │  │ ┌─────────────────────────────┐ │
│                                 │  │ │[•] Hypertension             │ │
│                                 │  │ │[ ] Diabetes                 │ │
│                                 │  │ │[•] Hyperlipidemia           │ │
│                                 │  │ └─────────────────────────────┘ │
│                                 │  │                                 │
│                                 │  │ Notes:                         │
│                                 │  │ ┌─────────────────────────────┐ │
│                                 │  │ │Patient reports improvement  │ │
│                                 │  │ │in symptoms after medication │ │
│                                 │  │ │adjustment.                  │ │
│                                 │  │ └─────────────────────────────┘ │
└─────────────────────────────────┘  └─────────────────────────────────┘
```

### Key Features of the Dynamic Form Editor

1. **Adaptive Structure**: Forms dynamically adapt to the data structure extracted by the LLM

2. **Field Type Recognition**: Automatically selects appropriate input controls:
   - Text inputs for strings
   - Date pickers for dates
   - Numeric inputs with validation for numbers
   - Checkboxes for boolean values
   - Tables for array data
   - Nested sections for nested objects

3. **Data Validation**: Context-aware validation (e.g., ensuring dates are valid, numbers are within expected ranges)

4. **Field Addition**: Users can add missing fields that weren't detected by the LLM

5. **Real-time JSON Generation**: While users interact with the friendly interface, the system maintains the structured JSON data in the background

## Technology Stack
- **Frontend**: Next.js, Tailwind CSS, React Query
- **Backend**: Next.js API routes or Express.js
- **Storage**: MongoDB (metadata), Local storage (for extracted files)
- **External APIs**: 
  - OCR API (provided externally)
  - LLM API for structured data extraction
- **Data Editing**: Dynamic form generation based on extracted data structure

## Further Details
For implementation details, please refer to the corresponding sections in `PROJECT_PLAN.md`:

- [Features and Workflows](PROJECT_PLAN.md#features-and-workflows) - Complete descriptions of each feature
- [Implementation Phases](PROJECT_PLAN.md#implementation-phases) - Step-by-step development plan
- [Data Models](PROJECT_PLAN.md#data-models) - Technical specifications for data structures
- [API Endpoints](PROJECT_PLAN.md#api-endpoints) - API design and routes
- [Component Library](PROJECT_PLAN.md#component-library) - Reusable UI components 

const systemPrompt = `
You are a document verification assistant for personal loan applications.

You will analyze OCR text from uploaded documents against this exact loan checklist:
${JSON.stringify(LOAN_CHECKLIST)}

For each checklist item in the exact structure provided:
1. Look for evidence in the OCR text that satisfies the checkpoints
2. Determine if the document matches what's needed
3. Return "Yes" or "No" in the exact fields "Data Entry Matching (to be checked by AI)" and "Applicant"
4. Provide evidence showing what text was found to support your verification in the "evidence" field

Respond ONLY with a valid JSON array matching the checklist structure.
`;

const userPrompt = `
Here are the OCR results from the uploaded documents:
${JSON.stringify(documents.map(doc => ({
  type: doc.finalDocumentType || doc.userConfirmedType,
  filename: doc.filename,
  ocrText: doc.ocrText
})))}

Verify these documents against the loan checklist and provide a structured response as a JSON array.
`; 