# Document Processing Application - Project Plan

## Overview
This application allows users to upload a zip file containing multiple documents (PDF, JPG, PNG), process them through an external OCR API, extract structured data using LLMs, and review/confirm the extracted information before proceeding.

> **Note**: For visual diagrams of the workflow, data flow, and UI examples, please refer to the `README.md` file.

## Technology Stack
### Frontend
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **State Management**: React Query / Context API
- **File Upload**: React Dropzone (for zip files)
- **Form Builder**: Dynamic form generation based on extracted data structure
- **Component Library**: Reusable components for document preview and consistent UI

### Backend
- **Server**: Next.js API routes or Express.js
- **Storage**: 
  - MongoDB (for metadata)
  - AWS S3 (for zip file storage)
  - Local storage (for extracted files)
- **Authentication**: JWT (JSON Web Tokens)
- **API Integration**: 
  - External OCR API (provided)
  - LLM API for structured data extraction
- **Validation**: Schema validation for API requests and responses
- **AWS SDK**: boto3 for S3 operations

## Features and Workflows
The application follows this sequential workflow:

1. **Authentication**
   - Login screen with mock credentials
   - Session management

2. **Zip File Upload**
   - Zip file uploader with drag-and-drop support
   - Upload status indicator (in progress/done)
   - Validation for zip file size and format

3. **Backend Processing**
   - Upload zip file to AWS S3 using boto3
   - Display upload progress using tqdm
   - Call external OCR API with S3 bucket and key information
   - API authentication using Username/Password
   - Display processing status with loader (no percentage)
   - Receive filename-to-OCR-text mapping from API
   - Extract files locally for preview functionality

4. **Document Type Mapping**
   - Present list of files from API response
   - Allow user to assign document types to each file
   - Document preview option
   - Bulk selection capabilities
   - Confirm selections

5. **LLM Processing**
   - Process OCR text with LLM to extract structured data
   - Status indicators
   - Error handling

6. **Document Review**
   - Split view interface:
     - Original document display (left)
     - Dynamic form-based data editor (right)
   - Navigation between multiple documents
   - User-friendly data editing with adaptive UI based on document structure
   - Confirmation controls (Approve/Reject/Edit)
   - Adaptive form generation based on document structure
   - Local storage of both raw and edited data

7. **User Decision**
   - Approve: Confirm extracted data
   - Reject: Return to processing
   - Edit: Return to document review for further modifications

8. **Process Completion**
   - Check for more documents 
   - If yes, return to Document Review
   - If no, complete the process

## API Integrations
- **AWS S3**: For uploading and storing zip files
- **External OCR API**: For processing uploaded documents from S3
- **LLM API connector**: For structured data extraction
- **Standardized API response formats**: For consistent processing

## Implementation Details

### AWS S3 Integration
```python
import boto3
from botocore.exceptions import NoCredentialsError
from tqdm import tqdm
import os

class ProgressPercentage:
    def __init__(self, filename):
        self._filename = filename
        self._size = float(os.path.getsize(filename))
        self._seen_so_far = 0
        self._tqdm = tqdm(total=self._size, unit='B', unit_scale=True, desc=os.path.basename(filename))

    def __call__(self, bytes_amount):
        self._seen_so_far += bytes_amount
        self._tqdm.update(bytes_amount)

def upload_zip_to_s3(file_path, bucket_name, region_name='us-east-1'):
    """
    Uploads a zip file to an S3 bucket root with progress bar, using the same filename.

    Args:
        file_path (str): Local path to the zip file.
        bucket_name (str): S3 bucket name.
        region_name (str): AWS region of the bucket.
    """
    try:
        file_name = os.path.basename(file_path)  # Extract just the filename
        s3 = boto3.client('s3', region_name=region_name)
        s3.upload_file(
            Filename=file_path,
            Bucket=bucket_name,
            Key=file_name,
            Callback=ProgressPercentage(file_path)
        )
        print(f"\n✅ Upload successful: s3://{bucket_name}/{file_name}")
        return f"s3://{bucket_name}/{file_name}"
    except FileNotFoundError:
        print("❌ The file was not found.")
    except NoCredentialsError:
        print("❌ AWS credentials not found.")
    except Exception as e:
        print(f"❌ An error occurred: {e}")
```

### OCR API Integration
```python
import requests
import json

def process_zip_with_ocr(bucket_name, s3_key, request_id=None):
    """
    Sends the S3 location of the uploaded zip file to the OCR API for processing.
    
    Args:
        bucket_name (str): S3 bucket name.
        s3_key (str): Path to zip file in S3 bucket.
        request_id (str, optional): Unique ID for the request. Generated if None.
    
    Returns:
        dict: API response with OCR results.
    """
    import uuid
    if request_id is None:
        request_id = str(uuid.uuid4())
        
    url = "http://rulesyncapi-cl1.ap-south-1.elasticbeanstalk.com/api/v1/cam_ocr"
    
    payload = json.dumps({
      "request_id": request_id,
      "bucket_name": bucket_name,
      "s3_key": s3_key
    })
    
    headers = {
      'Username': 'chat@service.user',
      'Password': 'chat@123',
      'Content-Type': 'application/json'
    }
    
    response = requests.request("POST", url, headers=headers, data=payload)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"OCR API error: {response.text}")
```

## Implementation Phases
### Phase 1: Project Setup
- Initialize Next.js application
- Configure Tailwind CSS
- Set up basic routing
- Create mock authentication
- Set up AWS credentials and S3 bucket

### Phase 2: Zip File Upload
- Implement zip file upload interface
- Integrate S3 upload functionality
- Implement upload progress indicator with tqdm
- Handle S3 upload errors

### Phase 3: OCR API Integration
- Connect to external OCR API
- Set up S3 to OCR API flow
- Implement API authentication
- Implement response parsing
- Create loading visualization
- Implement error handling

### Phase 4: Document Type Mapping
- Build document type selection interface
- Create document preview functionality
- Implement bulk selection options
- Set up user confirmation flow

### Phase 5: LLM Integration
- Implement LLM API calls for data extraction
- Connect OCR text to LLM processing
- Create processing visualization
- Implement error handling

### Phase 6: Review Interface
- Build reusable DocumentPreview component
- Develop dynamic form builder based on data structure
- Implement document navigation
- Create validation and confirmation flow

### Phase 7: Testing & Optimization
- Cross-browser testing
- Performance optimization
- Error handling improvements
- S3 and API integration testing

## Data Models
### User
- ID
- Username
- Password (hashed)
- Session information

### Document
- ID
- User ID (owner)
- Original filename
- File type
- Document type (assigned by user after OCR)
- Upload timestamp
- Processing status
- S3 Storage reference (for original zip)
- Local storage reference (for preview)
- OCR text
- Error information (if applicable)

### ExtractedData
- Document ID
- Raw OCR text
- Structured data (dynamic schema per document)
- Verification status
- User modifications
- Confirmation timestamp

### OCRProcessingJob
- Job ID (matches request_id sent to API)
- User ID
- S3 bucket name
- S3 key (zip filename)
- Submission timestamp
- Processing status
- Completion timestamp
- Error information (if applicable)

## API Endpoints
### Authentication
- POST /api/auth/login

### Documents
- POST /api/documents/upload-zip
  - Uploads zip file to S3 and returns S3 location
- POST /api/process/ocr-zip
  - Submits S3 location to OCR API
- GET /api/documents/list
  - Lists all documents and their processing status
- GET /api/documents/:id
  - Gets document details including OCR text
- POST /api/documents/assign-types
  - Assigns document types to processed files

### Processing
- POST /api/process/extract
  - Processes OCR text with LLM to extract structured data
- PUT /api/documents/:id/verify
  - Updates verification status of document

## Component Library
- DocumentPreview: Consistent file display component
- ProcessingIndicator: Visual indicator for document processing state
- ErrorDisplay: Standardized error visualization
- DynamicFormBuilder: Form component that adapts to extracted data structure

## Next Steps
After completion of the initial document processing workflow, additional features can be implemented as mentioned for later explanation. 