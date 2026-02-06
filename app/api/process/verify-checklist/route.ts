import { NextRequest, NextResponse } from 'next/server';
import { EnhancedDummyData } from '@/utils/mockingState';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Define interfaces for document and verification result types
interface Document {
  filename: string;
  ocrText?: string;
  [key: string]: any; // For any additional properties
}

export async function POST(request: NextRequest) {
  try {
    const { documents } = await request.json() as { documents: Document[] };

    // Check for mock mode header
    const mockMode = request.headers.get('X-Mock-Mode');
    if (mockMode === 'enabled') {
      console.log('🎭 MOCK MODE: Returning enhanced checklist verification dummy data');
      
      // Add 15-second realistic processing delay for demo
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      return NextResponse.json({
        success: true,
        verificationResults: EnhancedDummyData.creditAssessmentMemo,
        rawLlmOutput: `🔍 **DOCUMENT VERIFICATION COMPLETE** - Enhanced Demo Mode

✨ **MOCK MODE ACTIVE** - Showcasing Advanced Document Processing

📊 **Verification Statistics:**
- Documents Analyzed: ${documents?.length || 9}
- Data Points Extracted: ${EnhancedDummyData.creditAssessmentMemo.length}
- Verification Success Rate: ${Math.round((EnhancedDummyData.creditAssessmentMemo.filter((item: any) => item.verification_status === 'VERIFIED').length / EnhancedDummyData.creditAssessmentMemo.length) * 100)}%
- Processing Time: 1.8 seconds (demo accelerated)

🎯 **Key Verifications Completed:**
${EnhancedDummyData.creditAssessmentMemo.slice(0, 10).map((item: any, index: number) => 
  `${index + 1}. ${item.field_name} - ${item.verification_status || 'VERIFIED'} (${item.confidence_score || 95}% confidence)`
).join('\n')}

🏆 **AI Processing Highlights:**
- Cross-document validation completed
- Identity verification: 100% match
- Income verification: ✅ Confirmed
- Employment details: ✅ Validated  
- Banking information: ✅ Verified
- Credit history: ✅ Analyzed

🚀 **Advanced Features Demonstrated:**
- Intelligent field extraction
- Document type classification
- Cross-reference validation
- Confidence scoring algorithms
- Real-time data verification

💡 **Business Value:**
- Verification time: 1.8s (vs 45+ minutes manual)
- Data accuracy: ${Math.round((EnhancedDummyData.creditAssessmentMemo.filter((item: any) => item.verification_status === 'VERIFIED').length / EnhancedDummyData.creditAssessmentMemo.length) * 100)}%
- Cost reduction: 90%+ vs manual processing
- Risk detection: Multi-layered analysis

This enhanced demo showcases our enterprise document verification platform.`,
        processingTime: '1.8s',
        dataPointsExtracted: EnhancedDummyData.creditAssessmentMemo.length,
        verificationRate: 94,
        confidenceScore: 96
      });
    }
    
    // Format OCR data for the prompt
    const ocrData = documents.map(doc => {
      // Try to guess the document type from filename
      let docType = 'Unknown Document';
      const filename = doc && doc.filename ? doc.filename.toLowerCase() : '';
      
      if (filename.includes('aadhar') || filename.includes('aadhaar')) {
        docType = 'Aadhaar Card';
      } else if (filename.includes('pan')) {
        docType = 'PAN Card';
      } else if (filename.includes('bank') || filename.includes('statement')) {
        docType = 'Bank Statement';
      } else if (filename.includes('salary') || filename.includes('slip')) {
        docType = 'Salary Slip';
      } else if (filename.includes('form16') || filename.includes('form 16')) {
        docType = 'Form16';
      } else if (filename.includes('utility') || filename.includes('bill')) {
        docType = 'Utility Bill';
      } else if (filename.includes('cpv') || filename.includes('report')) {
        docType = 'CPV Report';
      } else if (filename.includes('bureau') || filename.includes('cibil')) {
        docType = 'Bureau Report';
      } else if (filename.includes('application') || filename.includes('form')) {
        docType = 'Application Form';
      } else if (filename.includes('ekyc')) {
        docType = 'eKYC';
      } else if (filename.includes('digilocker')) {
        docType = 'DigiLocker';
      } else if (filename.includes('mandate') || filename.includes('enach')) {
        docType = 'eNACH Mandate';
      }
      
      return {
        document_type: docType,
        content: doc.ocrText || 'No OCR text available'
      };
    });



    // Template to be populated
    const template = [
      {
        "s_no": 1,
        "field_name": "Applicant Name",
        "Source_to_be_looked_at_in_ocr": "PAN Card",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 2,
        "field_name": "Applicant Name",
        "Source_to_be_looked_at_in_ocr": "Aadhaar Card",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 3,
        "field_name": "Applicant Name",
        "Source_to_be_looked_at_in_ocr": "Application Form",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 4,
        "field_name": "Date of Birth",
        "Source_to_be_looked_at_in_ocr": "PAN Card",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 5,
        "field_name": "Date of Birth",
        "Source_to_be_looked_at_in_ocr": "Aadhaar Card",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 6,
        "field_name": "Gender",
        "Source_to_be_looked_at_in_ocr": "Aadhaar Card",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 7,
        "field_name": "Gender",
        "Source_to_be_looked_at_in_ocr": "Application Form",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 8,
        "field_name": "Mobile Number",
        "Source_to_be_looked_at_in_ocr": "Application Form",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 9,
        "field_name": "Mobile Number",
        "Source_to_be_looked_at_in_ocr": "Bank Statement",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 10,
        "field_name": "Mobile Number",
        "Source_to_be_looked_at_in_ocr": "eKYC",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 11,
        "field_name": "Email ID",
        "Source_to_be_looked_at_in_ocr": "Application Form",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 12,
        "field_name": "PAN Number",
        "Source_to_be_looked_at_in_ocr": "PAN Card",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 13,
        "field_name": "PAN Number",
        "Source_to_be_looked_at_in_ocr": "eKYC",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 14,
        "field_name": "Aadhaar Number",
        "Source_to_be_looked_at_in_ocr": "Aadhaar Card",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 15,
        "field_name": "Aadhaar Number",
        "Source_to_be_looked_at_in_ocr": "eKYC",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 16,
        "field_name": "Current Address",
        "Source_to_be_looked_at_in_ocr": "Aadhaar Card",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 17,
        "field_name": "Current Address",
        "Source_to_be_looked_at_in_ocr": "Utility Bill",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 18,
        "field_name": "Current Address",
        "Source_to_be_looked_at_in_ocr": "CPV Report",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 19,
        "field_name": "Permanent Address",
        "Source_to_be_looked_at_in_ocr": "Aadhaar Card",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 20,
        "field_name": "Permanent Address",
        "Source_to_be_looked_at_in_ocr": "Utility Bill",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 21,
        "field_name": "Permanent Address",
        "Source_to_be_looked_at_in_ocr": "CPV Report",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 22,
        "field_name": "Requested Loan Amount",
        "Source_to_be_looked_at_in_ocr": "Application Form",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 23,
        "field_name": "Loan Tenure",
        "Source_to_be_looked_at_in_ocr": "Application Form",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 24,
        "field_name": "Purpose of Loan",
        "Source_to_be_looked_at_in_ocr": "Application Form",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 25,
        "field_name": "Employer Name",
        "Source_to_be_looked_at_in_ocr": "Salary Slip",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 26,
        "field_name": "Employer Name",
        "Source_to_be_looked_at_in_ocr": "Form16",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 27,
        "field_name": "Employer Category",
        "Source_to_be_looked_at_in_ocr": "Internal Employer Database",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 28,
        "field_name": "Net Monthly Salary",
        "Source_to_be_looked_at_in_ocr": "Salary Slip",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 29,
        "field_name": "Net Monthly Salary",
        "Source_to_be_looked_at_in_ocr": "Bank Statement",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 30,
        "field_name": "Gross Monthly Salary",
        "Source_to_be_looked_at_in_ocr": "Salary Slip",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 31,
        "field_name": "Gross Monthly Salary",
        "Source_to_be_looked_at_in_ocr": "Form16",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 32,
        "field_name": "Salary Credit Confirmation",
        "Source_to_be_looked_at_in_ocr": "Bank Statement",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 33,
        "field_name": "Average Monthly Balance",
        "Source_to_be_looked_at_in_ocr": "Bank Statement",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 34,
        "field_name": "EMI Deductions",
        "Source_to_be_looked_at_in_ocr": "Bank Statement",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 35,
        "field_name": "EMI Deductions",
        "Source_to_be_looked_at_in_ocr": "Bureau Report",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 36,
        "field_name": "Cheque Bounce Count",
        "Source_to_be_looked_at_in_ocr": "Bank Statement",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 37,
        "field_name": "FOIR",
        "Source_to_be_looked_at_in_ocr": "Derived (EMIs / Net Income)",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 38,
        "field_name": "CIBIL Score",
        "Source_to_be_looked_at_in_ocr": "Bureau Report",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 39,
        "field_name": "Loan Enquiry Volume",
        "Source_to_be_looked_at_in_ocr": "Bureau Report",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 40,
        "field_name": "Current Loan Obligations",
        "Source_to_be_looked_at_in_ocr": "Bureau Report",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 41,
        "field_name": "Overdue Accounts",
        "Source_to_be_looked_at_in_ocr": "Bureau Report",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 42,
        "field_name": "KYC Match Status",
        "Source_to_be_looked_at_in_ocr": "eKYC",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 43,
        "field_name": "KYC Match Status",
        "Source_to_be_looked_at_in_ocr": "DigiLocker",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 44,
        "field_name": "Bank Account Verification",
        "Source_to_be_looked_at_in_ocr": "eNACH Mandate",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 45,
        "field_name": "Bank Account Verification",
        "Source_to_be_looked_at_in_ocr": "Bank Statement",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 46,
        "field_name": "Mandate Status",
        "Source_to_be_looked_at_in_ocr": "eNACH Mandate",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 47,
        "field_name": "Application Type (Salaried/Self-employed)",
        "Source_to_be_looked_at_in_ocr": "Application Form",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 48,
        "field_name": "Salary Mode (Cash/Bank)",
        "Source_to_be_looked_at_in_ocr": "Salary Slip",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 49,
        "field_name": "Salary Mode (Cash/Bank)",
        "Source_to_be_looked_at_in_ocr": "Bank Statement",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      },
      {
        "s_no": 50,
        "field_name": "Document Verification Status",
        "Source_to_be_looked_at_in_ocr": "Internal Ops System",
        "Field_data_found_in_OCR": "",
        "Source_where_actually_data_is_found": "",
        "ai_comments": ""
      }
    ];
    
    // Construct the system prompt with the user's provided template
    const systemPrompt = `You are an expert loan document processor and data extractor. Your task is to process OCR data from multiple documents uploaded during a loan application process, and populate every empty field in the provided JSON template with the appropriate data.`;
    
    const userPrompt = `Your task is to process OCR data from multiple documents uploaded during a loan application process, and populate every empty field in the provided JSON template with the appropriate data. If a document is missing, set its value to "Document not found" and if data within a found document is missing, set its value to "Data not found in Document OCR".

IMPORTANT: Do not rely solely on filenames to identify document types. A single file may contain multiple document types (e.g., a "KYC.pdf" might contain both Aadhaar and PAN card information). Carefully analyze the content of each document to identify what document types are actually present, regardless of filename.

You will receive two inputs:
1. **OCR Data**: A JSON array of document objects, each with:
   - \`"document_type"\`: the initially assumed source name (e.g. "PAN Card", "Aadhaar Card", etc.) based on filename, which may be incorrect
   - \`"content"\`: the raw OCR text for that document.
2. **Fields Template**: The template below, a JSON array of field-definitions, each containing:
   - \`s_no\`
   - \`field_name\`
   - \`Source_to_be_looked_at_in_ocr\` (preferred document)
   - empty \`Field_data_found_in_OCR\`
   - empty \`Source_where_actually_data_is_found\`
   - empty \`ai_comments\`
empty ones are supposed to be populated by you.

# Workflow

1. **Primary lookup**: For each entry in the Fields Template, search its specified \`Source_to_be_looked_at_in_ocr\` document's OCR text for the \`field_name\`.
   - Remember: The document might be present even if not labeled correctly in the filename, so check all document content
2. **Secondary lookup**: If not found in the preferred source, search all other OCR documents.
3. **Populate results**:
   - If you find a match, set:
     - \`Field_data_found_in_OCR\` to the extracted value,
     - \`Source_where_actually_data_is_found\` to the actual \`document_type\` where it was found.
   - If the specified document is missing, set:
     - \`Field_data_found_in_OCR\` to \`"Document not found"\`,
     - Leave the \`"Source_where_actually_data_is_found"\` and \`"ai_comments"\` as \`""\`.
   - If no match available and document is found, then set:
     - \`Field_data_found_in_OCR\` to \`"Data not found in Document OCR"\`,
     - Leave \`"Source_where_actually_data_is_found"\` and add ai \`"ai_comments"\` about how document ocr doesnt have the data. about the specific field. Comment should be short and insightful
4. **Return**: Output only the completed JSON array (no extra text).

# IMPORTANT: Output Format
Your response MUST be a flat JSON array where each element directly contains the fields s_no, field_name, Source_to_be_looked_at_in_ocr, Field_data_found_in_OCR, Source_where_actually_data_is_found, and ai_comments. 

DO NOT add any additional nesting or indexing. For example:

CORRECT FORMAT:
[
  {
    "s_no": 1,
    "field_name": "Applicant Name",
    "Source_to_be_looked_at_in_ocr": "PAN Card",
    "Field_data_found_in_OCR": "JOHN DOE",
    "Source_where_actually_data_is_found": "PAN Card",
    "ai_comments": "Extracted from PAN Card"
  },
  {
    "s_no": 2,
    ...
  }
]

INCORRECT FORMAT (DO NOT USE):
[
  {
    "0": {
      "s_no": 1,
      "field_name": "Applicant Name",
      ...
    }
  },
  ...
]

# OCR Data:
${JSON.stringify(ocrData, null, 2)}

# Template to fill:
${JSON.stringify(template, null, 2)}

# Examples

- If the OCR data for "Applicant Name" in "PAN Card" is missing: 
  - \`"Field_data_found_in_OCR"\`: "Document not found"
- If the "Applicant Name" cannot be extracted from the "PAN Card" document although available:
  - \`"Field_data_found_in_OCR"\`: "Data not found in Document OCR"
- If the "Applicant Name" is found and extracted from "Aadhaar Card":
  - \`"Field_data_found_in_OCR"\`: "Jane Doe"
  - \`"Source_where_actually_data_is_found"\`: "Aadhaar Card" 

# Notes

- Carefully differentiate between a document not being available and data not being found within a document.
- Ensure every template field is processed and returned whether data is found or not. 
- Return ONLY a valid JSON array with the properly filled template fields.
- Do not add any explanatory text outside the JSON array.`;
    
    try {
      // Call OpenAI with the new prompt
      const response = await openai.chat.completions.create({
        model: "o3-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `I need to extract information from OCR data to fill a template.

OCR Data: 
${JSON.stringify(ocrData, null, 2)}

Template to fill:
${JSON.stringify(template, null, 2)}

Instructions:
${userPrompt}`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      console.log('OpenAI API response received from o3-mini');
      const responseContent = response.choices[0].message.content || '[]';
      console.log('Response content preview:', responseContent.substring(0, 200) + '...');
      
      try {
        // Check if the response contains an error message
        if (responseContent.includes("error") && responseContent.includes("Invalid input format")) {
          console.error('LLM returned an error about input format. Attempting to use a simplified prompt...');
          
          // Try again with a simplified prompt
          const simplifiedResponse = await openai.chat.completions.create({
            model: "o3-mini",
            messages: [
              { 
                role: "system", 
                content: "You are an expert data extractor that finds information in documents and fills in templates."
              },
              { 
                role: "user", 
                content: `Extract information from these documents to fill the template fields.
                
First document (${ocrData[0]?.document_type || "Unknown"}):
${ocrData[0]?.content.substring(0, 500) || "No content"}
${ocrData.length > 1 ? `\nSecond document (${ocrData[1]?.document_type || "Unknown"}):\n${ocrData[1]?.content.substring(0, 500) || "No content"}` : ""}
${ocrData.length > 2 ? `\nThird document (${ocrData[2]?.document_type || "Unknown"}):\n${ocrData[2]?.content.substring(0, 500) || "No content"}` : ""}

Fill these fields (only first 10 shown):
1. "Applicant Name" from "${template[0].Source_to_be_looked_at_in_ocr}"
2. "Applicant Name" from "${template[1].Source_to_be_looked_at_in_ocr}"
3. "Applicant Name" from "${template[2].Source_to_be_looked_at_in_ocr}"
4. "Date of Birth" from "${template[3].Source_to_be_looked_at_in_ocr}"
5. "Date of Birth" from "${template[4].Source_to_be_looked_at_in_ocr}"

Return a JSON array where each object has:
- s_no (number)
- field_name (string)
- Source_to_be_looked_at_in_ocr (string)
- Field_data_found_in_OCR (string) - the extracted value or "Document not found" or "Data not found in Document OCR"
- Source_where_actually_data_is_found (string) - the document where data was found
- ai_comments (string) - brief explanation about the extraction

Format: [{"s_no": 1, "field_name": "...", ...}, ...]`
              }
            ],
            response_format: { type: "json_object" }
          });
          
          const simplifiedContent = simplifiedResponse.choices[0].message.content || '[]';
          console.log('Simplified response preview:', simplifiedContent.substring(0, 200) + '...');
          
          // Parse the simplified response
          const simplifiedParsed = JSON.parse(simplifiedContent);
          return NextResponse.json({
            success: true,
            verificationResults: Array.isArray(simplifiedParsed) ? simplifiedParsed : 
                                (simplifiedParsed.results || simplifiedParsed.result || []),
            rawLlmOutput: simplifiedContent,
            debugInfo: {
              systemPrompt: "Simplified prompt used due to initial error",
              userPrompt: "Simplified prompt used due to initial error"
            }
          });
        }
        
        const parsedContent = JSON.parse(responseContent);
        console.log('Successfully parsed API response');
        
        // Function to normalize response format in case the LLM returns nested objects
        const normalizeResponseFormat = (data: any[]) => {
          try {
            if (!Array.isArray(data)) return [];
            
            return data.map(item => {
              // Check if item has numeric keys with nested objects
              const keys = Object.keys(item);
              const isNested = keys.length === 1 && !isNaN(Number(keys[0]));
              
              if (isNested) {
                // Return the nested object directly
                return item[keys[0]];
              }
              return item;
            });
          } catch (err) {
            console.error('Error normalizing response format:', err);
            return data; // Return original if normalization fails
          }
        };
        
        // Standardize the response structure - check for common patterns
        let verificationResults = null;
        
        if (Array.isArray(parsedContent)) {
          // Direct array response - normalize the format
          verificationResults = normalizeResponseFormat(parsedContent);
          console.log('API returned direct array response');
        } else if (parsedContent.result && Array.isArray(parsedContent.result)) {
          // Results under "result" property
          verificationResults = normalizeResponseFormat(parsedContent.result);
          console.log('API returned results in "result" property');
        } else if (parsedContent.results && Array.isArray(parsedContent.results)) {
          // Results under "results" property
          verificationResults = normalizeResponseFormat(parsedContent.results);
          console.log('API returned results in "results" property');
        } else if (parsedContent.checklist && Array.isArray(parsedContent.checklist)) {
          // Results under "checklist" property
          verificationResults = normalizeResponseFormat(parsedContent.checklist);
          console.log('API returned results in "checklist" property');
        } else if (typeof parsedContent === 'object' && parsedContent !== null) {
          // Try to extract results from the object structure
          const potentialArrays = Object.entries(parsedContent)
            .filter(([_, value]) => Array.isArray(value) && value.length > 0)
            .map(([key, value]) => ({ key, value: value as any[] }));
          
          if (potentialArrays.length > 0) {
            // Find the largest array
            const largestArray = potentialArrays.reduce(
              (prev, curr) => (curr.value.length > prev.value.length ? curr : prev),
              potentialArrays[0]
            );
            verificationResults = normalizeResponseFormat(largestArray.value);
            console.log(`API returned results in "${largestArray.key}" property with ${(verificationResults as any[]).length} items`);
          } else {
            // Last resort - just use the whole object
            verificationResults = parsedContent;
            console.log('API returned object response, using as is');
          }
        }
        
        return NextResponse.json({
          success: true,
          verificationResults: verificationResults,
          rawLlmOutput: responseContent, // Include raw LLM output for debugging
          debugInfo: {
            systemPrompt,
            userPrompt
          }
        });
      } catch (parseError: unknown) {
        console.error('Error parsing API response:', parseError);
        return NextResponse.json({
          success: false,
          error: parseError instanceof Error ? parseError.message : 'Unknown error parsing API response'
        }, { status: 500 });
      }
    } catch (error: unknown) {
      console.error('OpenAI API error:', error);
      
      // Fallback: return empty results
      return NextResponse.json({
        success: false,
        verificationResults: [],
        apiError: error instanceof Error ? error.message : String(error)
      });
    }
  } catch (error: unknown) {
    console.error('Checklist verification error:', error);
    return NextResponse.json(
      { error: 'Error processing checklist verification' },
      { status: 500 }
    );
  }
} 