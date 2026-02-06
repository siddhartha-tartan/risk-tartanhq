import { NextResponse } from 'next/server';
import { EnhancedDummyData } from '@/utils/mockingState';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  console.log('[GENERATE CAM SUMMARY API] Request received');
  
  try {
    const data = await request.json();
    const { documents } = data;

    // Check for mock mode header
    const mockMode = request.headers.get('X-Mock-Mode');
    if (mockMode === 'enabled') {
      console.log('🎭 MOCK MODE: Returning enhanced CAM summary dummy data');
      
      // Add 15-second realistic processing delay for demo
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      return NextResponse.json({
        success: true,
        camSummary: EnhancedDummyData.camSummary,
        rawLlmOutput: `📋 **CREDIT ASSESSMENT MEMO (CAM) GENERATION COMPLETE** - Enhanced Demo Mode

✨ **MOCK MODE ACTIVE** - Showcasing Professional CAM Generation

🏦 **CAM Analysis Overview:**
- Applicant: Goutam Singh (31 years)
- Loan Request: ₹2,00,000 for 60 months  
- **AI Recommendation: DOCUMENTATION PENDING**
- Status: Under Review (Pending Complete Documentation)
- Risk Score: Incomplete - Requires Additional Data

📊 **Comprehensive Assessment:**
- Employment Verification: ✅ VERIFIED (3+ years, Microtek International)
- Income Analysis: ✅ STRONG (₹39,550/month confirmed)
- CIBIL Score: ✅ EXCELLENT (781/900)
- Documentation: ✅ COMPLETE (100% KYC compliant)
- Banking Behavior: ✅ STABLE (HDFC Bank, 2+ years)

⚠️ **Risk Mitigation Points:**
- High credit inquiries (15+ in 6 months)
- Address discrepancy requires verification
- Low liquidity buffer needs monitoring

🎯 **AI-Powered Features:**
- Multi-factor risk assessment
- Advanced financial modeling
- Automated compliance checking
- Predictive loan performance scoring
- Real-time decision recommendations

💡 **Business Impact:**
- Processing time: 15 seconds (vs 2+ hours manual)
- Preliminary assessment: 45% confidence (pending documentation)
- Risk factors identified: 6 key areas requiring verification
- Documentation completeness: 45%

This enhanced CAM demonstrates our enterprise AI platform's loan assessment capabilities.`,
        processingTime: '15 seconds',
        confidence: 45, // Lower due to insufficient documentation
        riskScore: 'Incomplete - Pending Documentation',
        recommendation: 'DOCUMENTATION PENDING'
      });
    }
    
    if (!documents || documents.length === 0) {
      console.error('[GENERATE CAM SUMMARY API] No documents provided in request');
      return NextResponse.json(
        { error: 'No documents provided' },
        { status: 400 }
      );
    }
    
    console.log(`[GENERATE CAM SUMMARY API] Processing ${documents.length} documents`);
    

    
    // Prepare document OCR text for the LLM
    const documentTexts = documents.map((doc: any) => ({
      filename: doc.originalFilename,
      documentType: doc.finalDocumentType || doc.userConfirmedType || doc.aiClassifiedType || 'unknown',
      ocrText: doc.ocrText || '[No OCR text available for this document]'
    }));
    
    // Create prompt for the LLM
    const prompt = createCamSummaryPrompt(documentTexts);
    
    // Call OpenAI GPT model
    console.log('[GENERATE CAM SUMMARY API] Calling o3-mini model');
    
    const completion = await openai.chat.completions.create({
      model: "o3-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert financial document analyzer specialized in personal loan applications. Your task is to analyze loan documents and create a comprehensive Credit Assessment Memo (CAM) Summary with precise, structured sections."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const llmResponse = completion.choices[0].message.content || '';
    console.log('[GENERATE CAM SUMMARY API] Received response from OpenAI');
    
    try {
      // Parse the response content
      const parsedContent = JSON.parse(llmResponse);
      console.log('Successfully parsed CAM Summary API response');
      
      // Extract the markdown content from the parsed JSON
      let formattedMarkdown = '';
      
      if (parsedContent.camSummary) {
        formattedMarkdown = parsedContent.camSummary;
      } else if (parsedContent.content) {
        formattedMarkdown = parsedContent.content;
      } else if (parsedContent.markdown) {
        formattedMarkdown = parsedContent.markdown;
      } else {
        // If no dedicated field exists, convert the entire object to markdown
        formattedMarkdown = convertJsonToMarkdown(parsedContent);
      }
      
      // Return the results
      return NextResponse.json({
        camSummary: formattedMarkdown,
        rawLlmOutput: llmResponse
      });
    } catch (parseError) {
      console.error('[GENERATE CAM SUMMARY API] Error parsing response:', parseError);
      
      // If JSON parsing fails, just use the raw response as markdown
      return NextResponse.json({
        camSummary: llmResponse,
        rawLlmOutput: llmResponse
      });
    }
  } catch (error) {
    console.error('[GENERATE CAM SUMMARY API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CAM Summary' },
      { status: 500 }
    );
  }
}

// Function to convert JSON to Markdown format
function convertJsonToMarkdown(json: any): string {
  let markdown = '# CAM Summary\n\n';
  
  // Process each section
  for (const [key, value] of Object.entries(json)) {
    // Convert camelCase or snake_case to Title Case for section headings
    const title = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    markdown += `## ${title}\n\n`;
    
    if (typeof value === 'string') {
      markdown += `${value}\n\n`;
    } else if (Array.isArray(value)) {
      value.forEach(item => {
        if (typeof item === 'string') {
          markdown += `- ${item}\n`;
        } else {
          markdown += `- ${JSON.stringify(item)}\n`;
        }
      });
      markdown += '\n\n';
    } else if (typeof value === 'object' && value !== null) {
      for (const [subKey, subValue] of Object.entries(value)) {
        const subTitle = subKey
          .replace(/([A-Z])/g, ' $1')
          .replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        markdown += `### ${subTitle}\n\n`;
        markdown += `${subValue}\n\n`;
      }
    } else {
      markdown += `${value}\n\n`;
    }
    
    // Add a horizontal rule between sections for better visual separation
    markdown += `---\n\n`;
  }
  
  return markdown;
}

// Function to create a prompt for the CAM Summary LLM
function createCamSummaryPrompt(documentTexts: { filename: string; documentType: string; ocrText: string }[]): string {
  return `
I need to generate a Credit Assessment Memo (CAM) Summary for a personal loan application. Below is the OCR text extracted from various loan documents.

DOCUMENTS:
${documentTexts.map(doc => `
FILENAME: ${doc.filename}
DOCUMENT TYPE: ${doc.documentType}
OCR TEXT:
${doc.ocrText.substring(0, 2000)} ${doc.ocrText.length > 2000 ? '... [text truncated]' : ''}
-------------------
`).join('\n')}

TASK:
Based on the above documents, provide a structured CAM Summary with the following information, formatted as a JSON object with a nested structure. Ensure "AI Decision on application" and "Suggestions by AI" are at the top.

{
  "camSummary": "# CAM Summary\\n\\n## AI Decision on application\\n\\n[Based on the following rules:\\n\\n- Cibil Norms not Met: >5 unsecured cibil enquiries in 1 month\\n- Cibil Norms not Met: 30+ in last 12 months in more than 1 TL\\n- Cibil Norms not Met: CIBIL <600\\n- Age Not Met: Min Age < 21 Years\\n- Age Not Met: Max Age > 62 Years\\n- Cibil Norms not Met: >5 Live Unsecured loans (>=50K) not allowed\\n- <=5 live Unsecured loans, Post BT customer can only have <=3 Live Unsecured Loans (Including ABFL)\\n- Poor Repayment: More than or Equal to 2 EMI Bounce in last 3 months]\\n\\n---\\n\\n## Suggestions by AI\\n\\n[Provide helpful suggestions based on the application data]\\n\\n---\\n\\n## Customer Profile\\n\\n[Extract and summarize key information about the customer]\\n\\n---\\n\\n## Income\\n\\n[Summarize income details from income proof, salary slips, etc.]\\n\\n---\\n\\n## Financials\\n\\n[Summarize key financial details from bank statements and other documents]\\n\\n---\\n\\n## Brief Info about salary / Company details\\n\\n[For business loans, include company details]\\n\\n---\\n\\n## Cibil & obligations\\n\\n[Extract CIBIL score and existing financial obligations]\\n\\n---\\n\\n## DPT\\n\\n[Include any Default Payment Track information]\\n\\n---\\n\\n## Overdue\\n\\n[List any overdue amounts on existing loans]\\n\\n---\\n\\n## Customer field Verification\\n\\n[Summary of customer verification details]\\n\\n---\\n\\n## Bounces\\n\\n[Any cheque or payment bounces]\\n\\n---\\n\\n## Proposal of customer\\n\\n[Amount, tenure, and other details of the current loan proposal]"
}

IMPORTANT GUIDELINES FOR CAM SUMMARY CONTENT:
1. Use proper markdown formatting with headings, subheadings, bullet points, and bold text for important information
2. Include exact figures where available, with currency symbols
3. For each section, provide specific details with exact data extracted from documents
4. Format data in easily readable patterns - use bullet points for lists, bold for key values, and tables where appropriate
5. Use **bold text** for important values like names, amounts, and key metrics
6. Put numeric values in a consistent format (e.g., ₹ 50,000)
7. For the AI Decision section, clearly indicate if any of the rules are violated
8. For analysis sections, structure information with sub-bullets and clear organization
9. Provide a comprehensive analysis and note any missing information
10. Add blank lines between paragraphs and subsections for better readability

Make sure your response is a valid JSON object with properly escaped special characters and newlines. The "camSummary" field should contain a markdown-formatted string with the complete CAM Summary.
`;
} 