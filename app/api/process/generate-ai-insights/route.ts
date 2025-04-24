import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Define interfaces for document and insights types
interface Document {
  filename: string;
  ocrText?: string;
  [key: string]: any; // For any additional properties
}

interface Insight {
  title: string;
  description: string;
  type: 'info' | 'warning' | 'error';
  relatedDocuments?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { documents } = await request.json() as { documents: Document[] };
    
    // Format OCR data for the prompt
    const ocrData = documents.map(doc => {
      // Try to guess the document type from filename
      let docType = 'Unknown Document';
      const filename = doc.filename.toLowerCase();
      
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
      } else if (filename.includes('application') || filename.includes('form')) {
        docType = 'Application Form';
      } else if (filename.includes('bureau') || filename.includes('cibil')) {
        docType = 'Bureau Report';
      } else if (filename.includes('voter')) {
        docType = 'Voter ID';
      } else if (filename.includes('driving') || filename.includes('licence')) {
        docType = 'Driving License';
      } else if (filename.includes('passport')) {
        docType = 'Passport';
      }
      
      return {
        document_type: docType,
        filename: doc.filename,
        content: doc.ocrText || 'No OCR text available'
      };
    });

    // Construct the system prompt
    const systemPrompt = `You are an expert loan document analyst with the ability to extract insights from multiple documents. 
Your task is to analyze OCR text from various loan application documents and identify important patterns, discrepancies, 
or issues that would be relevant for a loan officer or credit processing agent (CPA) to review.`;
    
    const userPrompt = `Review the OCR data from the following loan application documents and generate key insights.

IMPORTANT: Do not rely solely on filenames to identify document types. A single file may contain multiple document types (e.g., a "KYC.pdf" might contain both Aadhaar and PAN card information). Carefully analyze the content of each document to identify what document types are actually present, regardless of filename.

When analyzing documents:
1. First identify all document types present in each file by analyzing content patterns
2. Treat each identified document type as a separate logical document
3. Cross-reference information across all identified document types

Focus on:
1. Data discrepancies between documents (e.g., different names, DOB, income amounts)
2. Missing critical information across all documents
3. Red flags or potential issues (e.g., low bank balance, bounced checks)
4. Positive indicators for loan approval
5. Any inconsistencies between what the applicant stated and what the documents show

BE VERY SPECIFIC in your insights:
- When pointing out a discrepancy, ALWAYS cite the exact values from each document (e.g., "PAN Card shows name as 'John Smith' while Aadhaar Card shows 'John A. Smith'")
- Include precise amounts, dates, and figures from the documents when relevant
- For income verification, mention the specific salary amounts and dates found
- When discussing bank statements, include actual balance amounts and transaction details
- Cite the specific document names and sections where information was found

For each insight, provide:
- A concise, descriptive title that summarizes the finding
- A detailed explanation with SPECIFIC evidence and exact values from the documents
- A severity level (info, warning, error)
- List of related documents where this insight was derived from

Format your response as a JSON array of insight objects with the following structure:
[
  {
    "title": "Short insight title",
    "description": "Detailed explanation with specific evidence including exact values/data points found in documents",
    "type": "info|warning|error",
    "relatedDocuments": ["Document Type 1", "Document Type 2"]
  }
]

Use "info" for positive or neutral insights, "warning" for concerning items that need attention, and "error" for serious issues that could affect loan approval.

If you cannot find any meaningful insights, provide at least one "info" insight about the quality or completeness of the documentation.`;
    
    try {
      // Call OpenAI with the prompt
      const response = await openai.chat.completions.create({
        model: "o3-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `I need to analyze these loan application documents and generate insights.

OCR Data: 
${JSON.stringify(ocrData, null, 2)}

Instructions:
${userPrompt}`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      console.log('OpenAI API response received for AI insights generation');
      const responseContent = response.choices[0].message.content || '[]';
      
      try {
        // Parse the response content
        const parsedContent = JSON.parse(responseContent);
        console.log('Successfully parsed AI insights API response');
        
        // Function to extract insights array from the response
        const extractInsights = (data: any): Insight[] => {
          if (Array.isArray(data)) {
            return data;
          } else if (data.insights && Array.isArray(data.insights)) {
            return data.insights;
          } else if (data.results && Array.isArray(data.results)) {
            return data.results;
          } else if (typeof data === 'object' && data !== null) {
            // Look for any array property
            for (const key in data) {
              if (Array.isArray(data[key]) && data[key].length > 0) {
                return data[key];
              }
            }
          }
          return [];
        };
        
        // Get insights from the response
        const insights = extractInsights(parsedContent);
        
        // If no insights were found, provide a default one
        if (!insights || insights.length === 0) {
          const defaultInsight: Insight = {
            title: "Document Analysis Complete",
            description: "No significant issues or insights were found in the provided documents.",
            type: "info",
            relatedDocuments: ocrData.map(doc => doc.document_type)
          };
          
          return NextResponse.json({
            success: true,
            insights: [defaultInsight],
            rawLlmOutput: responseContent
          });
        }
        
        return NextResponse.json({
          success: true,
          insights: insights,
          rawLlmOutput: responseContent
        });
      } catch (parseError: unknown) {
        console.error('Error parsing AI insights API response:', parseError);
        return NextResponse.json({
          success: false,
          error: parseError instanceof Error ? parseError.message : 'Unknown error parsing API response'
        }, { status: 500 });
      }
    } catch (error: unknown) {
      console.error('OpenAI API error for AI insights:', error);
      
      return NextResponse.json({
        success: false,
        insights: [],
        apiError: error instanceof Error ? error.message : String(error)
      });
    }
  } catch (error: unknown) {
    console.error('AI insights generation error:', error);
    return NextResponse.json(
      { error: 'Error processing AI insights generation' },
      { status: 500 }
    );
  }
} 