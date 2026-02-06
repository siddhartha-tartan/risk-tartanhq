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
      console.log('🎭 MOCK MODE: Returning enhanced loan checklist dummy data');
      
      // Add 15-second realistic processing delay for demo
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      return NextResponse.json({
        success: true,
        loanChecklistResults: EnhancedDummyData.loanChecklist.checklist,
        rawLlmOutput: `🚨 **LOAN CHECKLIST VERIFICATION COMPLETE** - Enhanced Demo Mode

✨ **MOCK MODE ACTIVE** - Showcasing Advanced Compliance Verification

📋 **Checklist Summary:**
- Total Checkpoints: ${EnhancedDummyData.loanChecklist.checklist.length}
- Verified Items: ${EnhancedDummyData.loanChecklist.checklist.filter((item: any) => item['Data Entry Matching (Answer Yes or No)'] === 'YES').length}
- Compliance Rate: ${Math.round((EnhancedDummyData.loanChecklist.checklist.filter((item: any) => item['Data Entry Matching (Answer Yes or No)'] === 'YES').length / EnhancedDummyData.loanChecklist.checklist.length) * 100)}%
- Risk Assessment: HIGH (Mandatory Documents Missing)

🏆 **Key Verification Results:**
${EnhancedDummyData.loanChecklist.checklist.map((item: any, index: number) => 
  `${index + 1}. ${item.Document} - ${item['Data Entry Matching (Answer Yes or No)'] === 'YES' ? '✅ VERIFIED' : '⚠️ ATTENTION'}`
).join('\n')}

🎯 **AI Compliance Features:**
- Automated document verification
- Cross-reference validation
- Risk-based scoring
- Regulatory compliance checks
- Gap analysis reporting

🚨 **MANDATORY DOCUMENTS NOT AVAILABLE:**
${EnhancedDummyData.loanChecklist.checklist
  .filter((item: any) => item['Data Entry Matching (Answer Yes or No)'] === 'NO')
  .map((item: any) => `• ${item.Document}: ${item['AI Comments (reasoning behind decision)']}`)
  .join('\n')}

🔴 **CRITICAL ITEMS MISSING:**
- 3-Month Complete Salary History (Only 1 month provided)
- Employment Verification Letter (Not submitted)
- Utility Bills for Address Verification (Missing)
- Complete Bank Statement Coverage (Incomplete)

💡 **Business Impact:**
- Verification Time: 45 seconds (vs 30+ minutes manual)  
- Compliance Issues Detected: 4 critical missing documents
- Overall Compliance Rate: ${Math.round((EnhancedDummyData.loanChecklist.checklist.filter((item: any) => item['Data Entry Matching (Answer Yes or No)'] === 'YES').length / EnhancedDummyData.loanChecklist.checklist.length) * 100)}%
- Risk Level: HIGH - Cannot proceed without mandatory documents

This enhanced demo showcases our intelligent compliance verification system.`,
        processingTime: '45s',
        complianceRate: Math.round((EnhancedDummyData.loanChecklist.checklist.filter((item: any) => item['Data Entry Matching (Answer Yes or No)'] === 'YES').length / EnhancedDummyData.loanChecklist.checklist.length) * 100),
        totalChecks: EnhancedDummyData.loanChecklist.checklist.length,
        verifiedItems: EnhancedDummyData.loanChecklist.checklist.filter((item: any) => item['Data Entry Matching (Answer Yes or No)'] === 'YES').length,
        mandatoryMissing: EnhancedDummyData.loanChecklist.checklist.filter((item: any) => item['Data Entry Matching (Answer Yes or No)'] === 'NO').length,
        riskLevel: 'HIGH'
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
      } else if (filename.includes('voter')) {
        docType = 'Voter ID';
      } else if (filename.includes('driving') || filename.includes('licence')) {
        docType = 'Driving License';
      } else if (filename.includes('passport')) {
        docType = 'Passport';
      } else if (filename.includes('marriage')) {
        docType = 'Marriage Certificate';
      } else if (filename.includes('birth')) {
        docType = 'Birth Certificate';
      } else if (filename.includes('rent') || filename.includes('agreement')) {
        docType = 'Rental Agreement';
      }
      
      return {
        document_type: docType,
        content: doc.ocrText || 'No OCR text available'
      };
    });



    // Loan checklist template to be populated
    const template = [
      {
        "Categories": "Minimum Credit Parameters",
        "Subcategory (if applicable)": "no subcat",
        "Document": "Application form",
        "Checkpoints (what to check in docs)": "Physical form : Dully filled, Demographic, Cross Signed on Photograph & Signature Reference Details dully filled \nDigital Form : There will be seprate photos and no cross sign",
        "Matching Documents": "",
        "Data Entry Matching (Answer Yes or No)": "",
        "Applicant": "Mandatory",
        "AI Comments (reasoning behind decision)": ""
      },
      {
        "Categories": "Minimum Credit Parameters",
        "Subcategory (if applicable)": "no subcat",
        "Document": "Consent Mail",
        "Checkpoints (what to check in docs)": "Consent mail from registered e mail ID of the applicant\n(Details of consent should match with data and documents uploaded)",
        "Matching Documents": "",
        "Data Entry Matching (Answer Yes or No)": "",
        "Applicant": "Mandatory",
        "AI Comments (reasoning behind decision)": ""
      },
      {
        "Categories": "Minimum Credit Parameters",
        "Subcategory (if applicable)": "no subcat",
        "Document": "Bank Statement",
        "Checkpoints (what to check in docs)": "Customer Name , Bank Name, statement period, salary credit mismatches , Cointunity of bank statement  and subject to scheme/Programs",
        "Matching Documents": "",
        "Data Entry Matching (Answer Yes or No)": "",
        "Applicant": "Mandatory",
        "AI Comments (reasoning behind decision)": ""
      },
      {
        "Categories": "Minimum Credit Parameters",
        "Subcategory (if applicable)": "no subcat",
        "Document": "POI (Identity proof) - Aadhar card/Voter ID/Driving licence/Passport/Digi locker printouts/NREGA Printout signed by state government officials  - NOT APPLICABLE FOR PRE-APPROVED CASES (if No address change)",
        "Checkpoints (what to check in docs)": "Customer Name/DOB/Photo",
        "Matching Documents": "",
        "Data Entry Matching (Answer Yes or No)": "",
        "Applicant": "Mandatory",
        "AI Comments (reasoning behind decision)": ""
      },
      {
        "Categories": "Minimum Credit Parameters",
        "Subcategory (if applicable)": "no subcat",
        "Document": "POA (Address proof)-Aadhar card/Voter ID/Driving licence/Passport/Digi locker printouts/. Rental agreement with OHP of landlord ,(OVD declaration with OVD document), NREGA Job card . Exceptional scenarios - NOT APPLICABLE FOR PRE-APPROVED CASES (if No address change)",
        "Checkpoints (what to check in docs)": "Customer Name/DOB/address-pincode",
        "Matching Documents": "",
        "Data Entry Matching (Answer Yes or No)": "",
        "Applicant": "Mandatory",
        "AI Comments (reasoning behind decision)": ""
      },
      {
        "Categories": "Minimum Credit Parameters",
        "Subcategory (if applicable)": "no subcat",
        "Document": "Financial Proof -PAN/Form 60",
        "Checkpoints (what to check in docs)": "Name /Signature /PAN Number",
        "Matching Documents": "",
        "Data Entry Matching (Answer Yes or No)": "",
        "Applicant": "Mandatory",
        "AI Comments (reasoning behind decision)": ""
      },
      {
        "Categories": "Minimum Credit Parameters",
        "Subcategory (if applicable)": "no subcat",
        "Document": "DOB Proof -Driving licence/Passport/Birth or corporation certificate (name is mandatory) , School leaving certificate, LIC policy (Minimum 12 month in force), aadhar card, Voter ID with affidavit stated DOB",
        "Checkpoints (what to check in docs)": "DOB details",
        "Matching Documents": "",
        "Data Entry Matching (Answer Yes or No)": "",
        "Applicant": "Mandatory",
        "AI Comments (reasoning behind decision)": ""
      },
      {
        "Categories": "Minimum Credit Parameters",
        "Subcategory (if applicable)": "no subcat",
        "Document": "System Entry LOS - A) Sourcing Page - Scheme Group,Scheme Code,Loan Type, \nB) Sub-Product Financials (Not applicable for pre-approved) update of Banking,RTR, Eligbility ,\nC) Dedupe Process (Probable match will get confirmation from credit, \nD) RCU Trigger for LOD documents",
        "Checkpoints (what to check in docs)": "",
        "Matching Documents": "",
        "Data Entry Matching (Answer Yes or No)": "",
        "Applicant": "Mandatory",
        "AI Comments (reasoning behind decision)": ""
      },
      {
        "Categories": "Program Level Checklist",
        "Subcategory (if applicable)": "Salaried multiplier",
        "Document": "Income Proof -Payslip & Bank Statement required subject to scheme/program & Payslip",
        "Checkpoints (what to check in docs)": "Customer Name/ Pan No/ Bank A/C No/ Salary Month/ Minimum Income to be check",
        "Matching Documents": "",
        "Data Entry Matching (Answer Yes or No)": "",
        "Applicant": "Mandatory",
        "AI Comments (reasoning behind decision)": ""
      },
      {
        "Categories": "Program Level Checklist",
        "Subcategory (if applicable)": "Salaried multiplier",
        "Document": "3 months Bank Statement",
        "Checkpoints (what to check in docs)": "Customer Name/ Pan No/ Bank A/C No/ Salary Month/ Minimum Income to be check",
        "Matching Documents": "",
        "Data Entry Matching (Answer Yes or No)": "",
        "Applicant": "Mandatory",
        "AI Comments (reasoning behind decision)": ""
      },
      {
        "Categories": "Program Level Checklist",
        "Subcategory (if applicable)": "Salaried multiplier",
        "Document": "Last 3 months Salary slip",
        "Checkpoints (what to check in docs)": "Customer Name/ Pan No/ Bank A/C No/ Salary Month/ Minimum Income to be check",
        "Matching Documents": "",
        "Data Entry Matching (Answer Yes or No)": "",
        "Applicant": "Mandatory",
        "AI Comments (reasoning behind decision)": ""
      },
      {
        "Categories": "Program Level Checklist",
        "Subcategory (if applicable)": "Salaried multiplier BT",
        "Document": "PL repayment schedule and 6 months repayment track to check EMIs",
        "Checkpoints (what to check in docs)": "",
        "Matching Documents": "",
        "Data Entry Matching (Answer Yes or No)": "",
        "Applicant": "Mandatory",
        "AI Comments (reasoning behind decision)": ""
      },
      {
        "Categories": "Additional Checklist",
        "Subcategory (if applicable)": "no subcat",
        "Document": "Relationship Proof -Marriage Certificate/PAN card/Birth Certificate/Ration card/Passport/Voter ID/Aadhar card",
        "Checkpoints (what to check in docs)": "Blood Relative details match",
        "Matching Documents": "",
        "Data Entry Matching (Answer Yes or No)": "",
        "Applicant": "Mandatory",
        "AI Comments (reasoning behind decision)": ""
      },
      {
        "Categories": "Additional Checklist",
        "Subcategory (if applicable)": "no subcat",
        "Document": "Deemed OVD (In case current residence address not available in OVD )-Rental Agreement with landlord OHP/Bank Statement/Piped Gas Bill/Aaadhar Acknowledgment/HR Allotment Letter/Utility Bills (EB, telephone/postpaid, Water tax receipt, property tax - Latest 60 days ) - Along with any one of these documents additionally OVD declaration required (at disbursement stage). Within 90 days from disbursement  THE customer should submit the address changed OVD docs to ABFL",
        "Checkpoints (what to check in docs)": "Name/address/signature",
        "Matching Documents": "",
        "Data Entry Matching (Answer Yes or No)": "",
        "Applicant": "Mandatory",
        "AI Comments (reasoning behind decision)": ""
      },
      {
        "Categories": "Additional Checklist",
        "Subcategory (if applicable)": "no subcat",
        "Document": "Dual Name Declaration/ Dual DOB Declaration",
        "Checkpoints (what to check in docs)": "Name, check the correct/incorrect details , signature of borrowers",
        "Matching Documents": "",
        "Data Entry Matching (Answer Yes or No)": "",
        "Applicant": "Not Mandatory",
        "AI Comments (reasoning behind decision)": ""
      }
    ];
    
    // Construct the system prompt
    const systemPrompt = `You are an expert loan document processor and verification specialist. Your task is to verify loan application documents against a standard loan checklist.`;
    
    const userPrompt = `Your task is to analyze OCR data from uploaded loan application documents and fill in the missing fields in the provided loan checklist template.

IMPORTANT: Do not rely solely on filenames to identify document types. A single file may contain multiple document types (e.g., a "KYC.pdf" might contain both Aadhaar and PAN card information). Carefully analyze the content of each document to identify what document types are actually present, regardless of filename.

You will receive two inputs:
1. **OCR Data**: A JSON array of document objects, each with:
   - \`"document_type"\`: the initially assumed document name (e.g. "Application Form", "Aadhaar Card", etc.) based on filename, which may be incorrect
   - \`"content"\`: the raw OCR text for that document.
2. **Loan Checklist Template**: A JSON array with checklist items to verify, with these key fields:
   - \`Categories\`
   - \`Subcategory (if applicable)\`
   - \`Document\` - the document type to check
   - \`Checkpoints (what to check in docs)\` - specific elements to verify
   - Empty fields to fill:
     - \`Matching Documents\` - list any documents that match/contain this information
     - \`Data Entry Matching (Answer Yes or No)\` - whether the required data was found and matches
     - \`Applicant\` - "Mandatory" is already filled for most items 
     - \`AI Comments (reasoning behind decision)\` - your explanation of the verification results

# Your Task
For each item in the template:
1. Search across ALL OCR data to identify documents that match the required type, regardless of their filename
   - For example, if checking for "Aadhaar Card", check all documents for Aadhaar card characteristics like 12-digit numbers, demographic info, etc.
2. Check if the specified checkpoints (data points) are present and valid in the documents you identified
3. Fill in:
   - \`Matching Documents\` - list document types where the data was found, based on actual content not just filename
   - \`Data Entry Matching (Answer Yes or No)\` - "Yes" if data was found and valid, "No" if missing or invalid
   - \`AI Comments\` - explain your verification decision with specific details

# Response Format Rules
- If a required document is missing, set \`Data Entry Matching\` to "No" and add comment "Document not found"
- If checkpoints are partially met, explain exactly what was found and what was missing
- If data is inconsistent across documents, note the discrepancies
- Be specific in your comments about what exactly was verified or what issues were found
- Use "Yes" or "No" only for the \`Data Entry Matching\` field

Return your response as a JSON array with the completed checklist items.`;
    
    try {
      // Call OpenAI with the prompt
      const response = await openai.chat.completions.create({
        model: "o3-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `I need to verify loan application documents against our checklist.

OCR Data: 
${JSON.stringify(ocrData, null, 2)}

Loan Checklist Template:
${JSON.stringify(template, null, 2)}

Instructions:
${userPrompt}`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      console.log('OpenAI API response received for loan checklist verification');
      const responseContent = response.choices[0].message.content || '[]';
      
      try {
        // Parse the response content
        const parsedContent = JSON.parse(responseContent);
        console.log('Successfully parsed loan checklist API response');
        
        // Function to normalize response format in case the LLM returns nested objects
        const normalizeResponseFormat = (data: any) => {
          try {
            if (Array.isArray(data)) {
              return data;
            } else if (data.checklist && Array.isArray(data.checklist)) {
              return data.checklist;
            } else if (data.results && Array.isArray(data.results)) {
              return data.results;
            } else if (data.result && Array.isArray(data.result)) {
              return data.result;
            } else if (typeof data === 'object' && data !== null) {
              // Look for any array property
              for (const key in data) {
                if (Array.isArray(data[key]) && data[key].length > 0) {
                  return data[key];
                }
              }
            }
            return [];
          } catch (err) {
            console.error('Error normalizing response format:', err);
            return [];
          }
        };
        
        // Get the normalized checklist data
        const loanChecklistResults = normalizeResponseFormat(parsedContent);
        
        return NextResponse.json({
          success: true,
          loanChecklistResults: loanChecklistResults,
          rawLlmOutput: responseContent,
          debugInfo: {
            systemPrompt,
            userPrompt
          }
        });
      } catch (parseError: unknown) {
        console.error('Error parsing loan checklist API response:', parseError);
        return NextResponse.json({
          success: false,
          error: parseError instanceof Error ? parseError.message : 'Unknown error parsing API response'
        }, { status: 500 });
      }
    } catch (error: unknown) {
      console.error('OpenAI API error for loan checklist:', error);
      
      return NextResponse.json({
        success: false,
        loanChecklistResults: [],
        apiError: error instanceof Error ? error.message : String(error)
      });
    }
  } catch (error: unknown) {
    console.error('Loan checklist verification error:', error);
    return NextResponse.json(
      { error: 'Error processing loan checklist verification' },
      { status: 500 }
    );
  }
} 