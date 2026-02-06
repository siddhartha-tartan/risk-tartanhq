import { NextResponse } from 'next/server';
import { EnhancedDummyData } from '@/utils/mockingState';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  console.log('[ANALYZE BUSINESS DOCUMENTS API] Request received');
  
  try {
    const data = await request.json();
    const { documents } = data;

    // Check for mock mode header
    const mockMode = request.headers.get('X-Mock-Mode');
    if (mockMode === 'enabled') {
      console.log('🎭 MOCK MODE: Returning enhanced business analysis dummy data');
      
      // Add 15-second realistic processing delay for demo
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      return NextResponse.json({
        success: true,
        analysisResult: {
          applicantDetails: {
            name: "Goutam Singh",
            age: 31,
            employment: "Senior Sales Executive at Microtek International",
            income: "₹39,550/month",
            cibilScore: 781,
            riskProfile: "Moderate Risk - High Income, Credit Inquiry Concerns"
          },
          documentAnalysis: EnhancedDummyData.financialInsights.insights.reduce((acc: any, insight: any) => {
            acc[insight.title] = {
              finding: insight.description,
              riskLevel: insight.riskLevel || 'Medium',
              confidence: insight.confidence || 90,
              relatedDocs: insight.relatedDocuments || []
            };
            return acc;
          }, {}),
          overallAnalysis: {
            recommendation: "DOCUMENTATION PENDING",
            loanAmount: "₹2,00,000 (Under Review - Pending Complete Documentation)",
            reasoning: "Preliminary assessment shows potential eligibility, but insufficient documentation for final decision. Critical documents and verifications required.",
            conditions: ["Complete 3-month salary slips required", "Address verification mandatory", "Employment letter needed", "Additional bank statements required", "Physical verification pending"]
          },
          processingStats: {
            documentsAnalyzed: documents?.length || 9,
            aiConfidence: 45, // Lower confidence due to insufficient documentation
            processingTime: "15 seconds (comprehensive analysis)"
          }
        },
        rawLlmOutput: `🏦 **BUSINESS DOCUMENT ANALYSIS COMPLETE** - Enhanced Demo Mode

✨ **MOCK MODE ACTIVE** - Showcasing Advanced AI Business Analysis

📋 **Analysis Summary:**
- Documents Processed: ${documents?.length || 9}  
- Risk Assessment: Preliminary assessment (requires additional documentation)
- AI Confidence: 45% (Low - Insufficient Documentation)
- Processing Time: 15s (Comprehensive analysis)

🎯 **Key AI Insights Generated:**
${EnhancedDummyData.financialInsights.insights.map((insight: any, index: number) => 
  `${index + 1}. ${insight.title} (${insight.confidence}% confidence)`
).join('\n')}

🚀 **Advanced Features Demonstrated:**
- Cross-document verification
- Risk pattern detection  
- Income stability analysis
- Credit behavior assessment
- Automated compliance checking

This enhanced demo showcases our enterprise-grade AI loan processing platform.`
      });
    }
    
    if (!documents || documents.length === 0) {
      console.error('[ANALYZE BUSINESS DOCUMENTS API] No documents provided in request');
      return NextResponse.json(
        { error: 'No documents provided' },
        { status: 400 }
      );
    }
    
    console.log(`[ANALYZE BUSINESS DOCUMENTS API] Processing ${documents.length} documents`);
    

    
    // Prepare document OCR text for the LLM
    const documentTexts = documents.map((doc: any) => ({
      filename: doc.originalFilename,
      ocrText: doc.ocrText || '[No OCR text available for this document]'
    }));
    
    // Create prompt for the LLM
    const prompt = createLlmPrompt(documentTexts);
    
    // Call OpenAI GPT model
    console.log('[ANALYZE BUSINESS DOCUMENTS API] Calling o3-mini model');
    
    // Construct the system prompt
    const systemPrompt = `You are an expert financial document analyzer specialized in business loan applications. Your task is to extract detailed financial and business data from loan application documents and provide structured analysis that helps a Credit Processing Agent (CPA) make informed lending decisions. Focus on extracting specific data points and highlighting relationships between information across different documents.`;
    
    try {
      // Call OpenAI with the prompt
      const response = await openai.chat.completions.create({
        model: "o3-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      
      console.log('OpenAI API response received from o3-mini');
      const responseContent = response.choices[0].message.content || '{}';
      
      try {
        // Parse the response content
        const parsedResult = JSON.parse(responseContent);
        console.log('[ANALYZE BUSINESS DOCUMENTS API] Successfully parsed API response');
        
        // Ensure document_analysis values are properly formatted strings
        if (parsedResult?.part2?.document_analysis) {
          Object.entries(parsedResult.part2.document_analysis).forEach(([key, value]) => {
            // If value is an object, leave it as is - the UI will handle it
            // If value is something else, convert to string
            if (typeof value !== 'object' && typeof value !== 'string') {
              parsedResult.part2.document_analysis[key] = String(value);
            }
          });
        }
        
        // Return the result
        return NextResponse.json({
          success: true,
          analysisResult: parsedResult,
          rawLlmOutput: responseContent,
          debugInfo: {
            systemPrompt,
            userPrompt: prompt.substring(0, 200) + '...' // Truncated for logging
          }
        });
      } catch (parseError: unknown) {
        console.error('[ANALYZE BUSINESS DOCUMENTS API] Error parsing API response:', parseError);
        
        // Return the raw response for debugging along with the error
        return NextResponse.json({
          success: false,
          error: parseError instanceof Error ? parseError.message : 'Unknown error parsing API response',
          rawLlmOutput: responseContent
        }, { status: 500 });
      }
    } catch (openaiError: unknown) {
      console.error('[ANALYZE BUSINESS DOCUMENTS API] OpenAI API error:', openaiError);
      
      return NextResponse.json({
        success: false,
        analysisResult: null,
        apiError: openaiError instanceof Error ? openaiError.message : String(openaiError)
      });
    }
  } catch (error: any) {
    console.error('[ANALYZE BUSINESS DOCUMENTS API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze business documents' },
      { status: 500 }
    );
  }
}

// Function to create a prompt for the LLM
function createLlmPrompt(documentTexts: { filename: string; ocrText: string }[]): string {
  return `
I need to analyze business loan documents to help a Credit Processing Agent (CPA) evaluate a loan application. Below is the OCR text extracted from various business documents.

DOCUMENTS:
${documentTexts.map(doc => `
FILENAME: ${doc.filename}
OCR TEXT:
${doc.ocrText.substring(0, 2000)} ${doc.ocrText.length > 2000 ? '... [text truncated]' : ''}
-------------------
`).join('\n')}

TASK:
Based on the above documents, provide a structured analysis in the following JSON format to help the CPA make an informed lending decision:

{
  "part1": {
    "applicant_details": {
      // Extract individual's details like name, DOB, PAN, Aadhaar, mobile, etc.
      // Include ALL key personal information found in the documents
    },
    "co_applicant_details": {
      // Include if a co-applicant is mentioned in any document
      // Similar fields as applicant_details
    },
    "business_details": {
      // Extract ALL key business information found: name, type, GSTIN, vintage (years in operation), 
      // location, annual turnover, industry sector, and any other relevant business metrics
    }
  },

  "part2": {
    "document_analysis": {
      // For each document, provide a single markdown-formatted string with 
      // both key data points and their significance to the loan application.
      // Example: 
      // "PAN Card": "**Key Data**:\n- PAN: ABCDE1234F\n- Name: Arun Kumar\n- Father's Name: Rajesh Kumar\n\n**Significance**:\n- The PAN details match with Aadhaar and application form\n- Confirms applicant identity"
      // Include ALL documents provided, with specific data points extracted formatted as markdown lists
    }
  },

  "part3": {
    "overall_analysis": [
      // Cross-document analysis focused on:
      // 1. Financial health insights (turnover trends, profit margins, cash flow patterns)
      // 2. Business stability indicators (years of operation, consistent filing of returns)
      // 3. Red flags or inconsistencies between documents
      // 4. Income and liability assessment across multiple documents
      // 5. Growth potential indicators
      // Provide minimum 5-7 detailed, data-driven insights with specific numbers and facts
    ]
  }
}

REMEMBER: This analysis is to help a CPA evaluate a loan application. Focus on extracting and highlighting meaningful financial and business information that would impact lending decisions. Don't simply verify documents - analyze the data within them.

IMPORTANT GUIDELINES:
1. For part2 document_analysis: Each document's analysis should be a MARKDOWN-FORMATTED STRING with clearly separated sections for data points and significance
2. Use markdown formatting (bold headers, bullet points) to make the document analysis readable
3. For part3 overall_analysis: Focus on CROSS-DOCUMENT analysis, showing relationships between information in different documents
4. Use null for missing values, not empty strings
5. Include an empty co_applicant_details object if none found
6. Ensure output is valid JSON with properly escaped special characters
7. When mentioning financial figures, always include exact amounts with currency symbols where available
8. Highlight any inconsistencies or unusual patterns that deserve the CPA's attention

Return ONLY the JSON object with no additional text, explanations, or markdown formatting.
  `;
} 