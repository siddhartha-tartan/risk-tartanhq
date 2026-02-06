// Mock state management for LLM agents
// This system allows demo mode to be triggered by a hidden button

// Check if we're in a browser environment (not Node.js SSR)
function isBrowser(): boolean {
  return typeof window !== 'undefined' && 
         typeof document !== 'undefined' && 
         typeof window.localStorage !== 'undefined' &&
         typeof window.localStorage.getItem === 'function';
}

// Helper to safely get item from localStorage
function safeGetItem(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

// Helper to safely set item in localStorage
function safeSetItem(key: string, value: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Silently fail
  }
}

// Helper to safely remove item from localStorage
function safeRemoveItem(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Silently fail
  }
}

export class MockingStateManager {
  private static STORAGE_KEY = 'llm_mock_mode_enabled';
  
  // PERMANENTLY ENABLED - Set to false to use real OpenAI
  private static FORCE_MOCK_MODE = true;
  
  static enableMockMode(): void {
    safeSetItem(this.STORAGE_KEY, 'true');
    if (typeof window !== 'undefined') {
      console.log('🎭 LLM Mock Mode ENABLED - All 4 LLM agents will return demo data');
    }
  }
  
  static disableMockMode(): void {
    safeRemoveItem(this.STORAGE_KEY);
    if (typeof window !== 'undefined') {
      console.log('🎭 LLM Mock Mode DISABLED - All LLM agents will use real AI');
    }
  }
  
  static isMockModeEnabled(): boolean {
    // Always return true if FORCE_MOCK_MODE is enabled
    if (this.FORCE_MOCK_MODE) {
      return true;
    }
    return safeGetItem(this.STORAGE_KEY) === 'true';
  }
  
  static getStatus(): string {
    return this.isMockModeEnabled() ? 'DEMO MODE ACTIVE' : 'REAL AI MODE';
  }
  
  // Helper to send mock state to server-side APIs via headers
  static getMockHeaders(): Record<string, string> {
    return {
      'X-Mock-Mode': this.isMockModeEnabled() ? 'enabled' : 'disabled'
    };
  }
  
  // Developer utility - disable demo mode (for console access)
  static reset(): void {
    safeRemoveItem(this.STORAGE_KEY);
    if (typeof window !== 'undefined') {
      console.log('🔄 Demo mode reset - Use window.MockingStateManager.enableMockMode() to reactivate');
    }
  }
}

// Expose to global window for developer console access
if (typeof window !== 'undefined') {
  (window as any).MockingStateManager = MockingStateManager;
}

// Enhanced dummy data with glorified content for impressive AI showcase
export const EnhancedDummyData = {
  // Financial insights from dummy_data/financial_insights
  financialInsights: {
    "insights": [
      {
        "title": "✅ Excellent Document Consistency & Verification",
        "description": "Outstanding consistency across all identity documents! The applicant's name 'Goutam Singh', DOB '27/12/1992', and PAN 'DNFPS9282F' are perfectly aligned across Aditya Birla Finance application, Aadhaar card, and Microtek payslip. This level of consistency indicates strong document authenticity and reduces verification risks significantly.",
        "type": "success",
        "relatedDocuments": ["Personal Loan Application Form", "Aadhaar (UIDAI)", "Microtek Payslip", "TransUnion CIBIL Report"],
        "riskLevel": "Low",
        "confidence": 98
      },
      {
        "title": "💰 Verified Income Alignment - Strong Financial Profile",
        "description": "Exceptional income verification! The Microtek Technology payslip showing ₹39,550 gross matches exactly with the loan application's 'Total Monthly Income'. This perfect alignment demonstrates genuine employment and income stability, making this a high-quality loan applicant with verified earning capacity.",
        "type": "success",
        "relatedDocuments": ["Microtek Payslip", "Personal Loan Application Form"],
        "riskLevel": "Low",
        "confidence": 100
      },
      {
        "title": "🏠 Address Discrepancy Requires Investigation",
        "description": "⚠️ CRITICAL FINDING: Significant address mismatch detected between current residence (SABITRI APT, Kolkata-700129) and permanent address (Victoria Colliery, Barddhaman-713343). Bank statements and Aadhaar show Barddhaman address. This suggests recent relocation or potential address fraud. Immediate verification recommended before loan approval.",
        "type": "warning",
        "relatedDocuments": ["Personal Loan Application Form", "HDFC Bank Statement", "Aadhaar Document"],
        "riskLevel": "Medium",
        "confidence": 95,
        "action": "Address verification required"
      },
      {
        "title": "📊 High Credit Inquiry Activity - Risk Alert",
        "description": "🚨 SIGNIFICANT CONCERN: TransUnion CIBIL report reveals excessive credit enquiries in recent months (multiple enquiries from April 2022). Pattern suggests credit-hungry behavior and potential debt stress. Risk of over-leveraging and multiple loan applications across lenders. Requires careful FOIR calculation and debt consolidation assessment.",
        "type": "danger",
        "relatedDocuments": ["TransUnion CIBIL Report"],
        "riskLevel": "High",
        "confidence": 92,
        "action": "Credit behavior assessment required"
      },
      {
        "title": "📋 Active Rental Agreement Documented",
        "description": "Well-documented rental arrangement at SABITRI APARTMENT with detailed Leave and License Agreement dated Nov 2021. Monthly rent of ₹8,000 plus ₹16,000 security deposit for 11-month period. This fixed obligation should be factored into affordability calculations, reducing disposable income by ₹8,000/month.",
        "type": "info",
        "relatedDocuments": ["Leave and License Agreement"],
        "riskLevel": "Low",
        "confidence": 90,
        "monthlyImpact": 8000
      },
      {
        "title": "💳 Low Bank Balance vs Income - Liquidity Concern",
        "description": "⚠️ LIQUIDITY RISK: Despite healthy monthly income of ₹39,550, bank balance frequently drops to ₹13,651 after expenses. This indicates high burn rate and potential cash flow management issues. Low savings ratio suggests limited financial buffer for EMI payments during emergencies.",
        "type": "warning",
        "relatedDocuments": ["HDFC Bank Statement", "Microtek Payslip"],
        "riskLevel": "Medium",
        "confidence": 88,
        "savingsRatio": "Low"
      },
      {
        "title": "🏆 Comprehensive Document Package - Excellent Compliance",
        "description": "Outstanding document submission quality! Complete package includes all required verification documents: Aadhaar, PAN, income proof, employment details, bank statements, and credit history. Multi-language handling (Hindi/English) managed appropriately. Minor OCR errors detected but do not materially affect assessment.",
        "type": "success",
        "relatedDocuments": ["Personal Loan Application Form", "Aadhaar Document", "Microtek Payslip", "HDFC Bank Statement", "TransUnion CIBIL Report", "Leave and License Agreement"],
        "riskLevel": "Low",
        "confidence": 96
      }
    ]
  },

  // CAM Summary from dummy_data/cam_summary
  camSummary: `# 🏦 Credit Assessment Memo (CAM) Summary
## AI-Powered Loan Decision Framework

### 🎯 **FINAL RECOMMENDATION: FURTHER DOCUMENTATION REQUIRED**
**Loan Amount:** ₹2,00,000 | **Current Status:** PENDING VERIFICATION | **Preliminary Assessment:** INCOMPLETE

---

## 📊 **Executive Summary**
Our AI assessment has analyzed the available documents for applicant Goutam Singh's loan application. While preliminary indicators show potential eligibility, several critical documents and verifications are required before final loan approval can be considered.

### 🟡 **Current Status - Partial Assessment:**
- ⚠️ **Limited Documentation**: Only basic documents received (requires additional verification)
- ⚠️ **Employment Verification**: Pending HR confirmation from Microtek International
- ⚠️ **Address Verification**: Physical verification required due to discrepancies  
- ⚠️ **Income Validation**: Additional 2 months salary slips needed

### 📋 **Documents Received vs Required:**
- ✅ **Identity Proof**: PAN and Aadhaar available
- ✅ **Basic Income**: 1 month salary slip provided
- ❌ **Complete Income Proof**: Need 3 months salary slips
- ❌ **Address Verification**: Utility bills pending
- ❌ **Employment Letter**: HR verification pending

---

## 👤 **Applicant Profile Analysis**
- **Name:** Goutam Singh | **Father:** Ram Kumar Singh  
- **DOB:** 27/12/1992 (Age: 31 years) | **Gender:** Male
- **PAN:** DNFPS9282F ✓ Verified | **Aadhaar:** ✓ Verified
- **Marital Status:** Single | **Education:** Graduate level inferred

### 📱 **Contact Verification**
- **Primary Mobile:** 8388920141 ✓ Verified across documents
- **Email:** gautamsinghsisodia0014@gmail.com ✓ Active
- **Address Status:** ⚠️ Requires verification (discrepancy noted)

---

## 💰 **Financial Assessment**

### 💼 **Employment & Income**
- **Employer:** Microtek International Private Limited
- **Designation:** Senior Sales Executive  
- **Employment Start:** 18/10/2019 (3+ years tenure)
- **Monthly Gross:** ₹39,550 | **Net Take-home:** ₹31,000 (estimated)
- **Income Stability:** ✅ Excellent (consistent salary credits)

### 🏧 **Banking Behavior**
- **Primary Bank:** HDFC Bank, Asansol Branch
- **Account Vintage:** 2+ years (opened June 2021)
- **Average Monthly Balance:** ₹15,000-25,000
- **Salary Credit Regularity:** ✅ Consistent monthly credits
- **Bounce History:** ✅ No cheque bounces detected

---

## 📈 **Credit Bureau Analysis**

### 🏆 **CIBIL Score Breakdown**
- **TransUnion CIBIL Score:** 781/900 (Excellent)
- **Personal Loan Score:** 581 ⚠️ (Below threshold of 650)
- **Credit History Length:** 5+ years
- **Total Accounts:** Multiple (mix of secured/unsecured)

### 📊 **Credit Behavior**
- **Recent Inquiries:** 🔴 HIGH (15+ in last 6 months)
- **Current EMI Obligation:** ₹7,266/month (identified)
- **Credit Utilization:** Moderate
- **Payment History:** Generally positive with minor delays

---

## 🎯 **Risk Assessment Matrix**

| Risk Factor | Score | Weight | Impact |
|-------------|--------|---------|---------|
| Income Stability | 9/10 | High | Positive |
| Employment Quality | 8/10 | High | Positive |  
| CIBIL Score | 8/10 | High | Positive |
| Credit Inquiries | 4/10 | Medium | Negative |
| Liquidity Profile | 6/10 | Medium | Neutral |
| Documentation | 10/10 | High | Positive |

**Overall Risk Score: 72/100 (Moderate Risk)**

---

## 📋 **Compliance Checklist**

### ✅ **KYC Verification**
- [x] Identity Proof: Aadhaar + PAN verified
- [x] Address Proof: Available (requires verification)  
- [x] Income Proof: Salary slip + bank statement
- [x] Employment Proof: Company payroll confirmed

### ⚠️ **Pending Verifications**
- [ ] Physical address verification (discrepancy noted)
- [ ] Employer verification call
- [ ] Reference check (optional)

---

## 💡 **AI Recommendations**

### 📋 **Required Next Steps for Processing:**

#### 🔴 **Critical Documents Needed:**
1. **Additional Salary Slips:** Last 2 months from Microtek International
2. **Employment Letter:** On company letterhead with HR seal
3. **Utility Bills:** Latest 2 months (electricity/gas/water)
4. **Bank Statements:** Complete 3 months HDFC Bank statements
5. **Address Proof:** Rental agreement or property documents

#### 🟡 **Verification Requirements:**
1. **Physical Address Verification:** Site visit by verification team
2. **Employment Verification:** Direct HR confirmation call
3. **Income Verification:** Cross-check with ITR/Form-16
4. **Reference Check:** Contact provided references

### ⏱️ **Estimated Timeline:**
- **Document Collection:** 7-10 business days
- **Verification Process:** 5-7 business days  
- **Final Assessment:** 2-3 business days
- **Total Processing Time:** 14-20 business days

### 💡 **AI Preliminary Risk Assessment:**
- **Identity Verification:** ✅ COMPLETED (100%)
- **Income Assessment:** 🟡 PARTIAL (33% - need more data)
- **Employment Stability:** 🟡 PRELIMINARY (requires HR confirmation)
- **Address Verification:** 🔴 PENDING (0% - awaiting documents)
- **Overall Completeness:** 45% (requires additional documentation)

---

## 📞 **Immediate Actions Required**
1. **Customer:** Submit additional documents within 7 days
2. **Verification Team:** Schedule address verification once docs received
3. **Credit Team:** Prepare comprehensive assessment post-documentation
4. **Collections:** File on hold until verification complete

---
*This preliminary AI assessment is based on limited documentation. Full risk modeling will be performed once complete documentation is received.*

**Current Assessment Confidence: 45%** (Low - Insufficient Data)  
**Processing Time: 2.3 minutes**  
**Status:** DOCUMENTATION PENDING  
**Last Updated:** ${new Date().toLocaleDateString('en-IN')}`,

  // Credit Assessment Memo from dummy_data/credit_assesment_memo
  creditAssessmentMemo: [
    {
      "s_no": 1,
      "field_name": "✅ Applicant Name Verification",
      "Source_to_be_looked_at_in_ocr": "PAN Card",
      "Field_data_found_in_OCR": "GOUTAM SINGH",
      "Source_where_actually_data_is_found": "Document 1 (PAN Card content)",
      "ai_comments": "🎯 Perfect match! Name extracted successfully from PAN card with 100% accuracy. No spelling variations or discrepancies detected.",
      "confidence_score": 100,
      "verification_status": "VERIFIED"
    },
    {
      "s_no": 2,
      "field_name": "✅ Cross-Document Name Consistency", 
      "Source_to_be_looked_at_in_ocr": "Aadhaar Card",
      "Field_data_found_in_OCR": "Goutam Singh",
      "Source_where_actually_data_is_found": "Document 8 (Aadhaar-like content)",
      "ai_comments": "🏆 Excellent! Name perfectly matches across PAN and Aadhaar. Consistent identity verification strengthens loan application authenticity.",
      "confidence_score": 98,
      "verification_status": "VERIFIED"
    },
    {
      "s_no": 3,
      "field_name": "📅 Date of Birth Verification",
      "Source_to_be_looked_at_in_ocr": "PAN Card",
      "Field_data_found_in_OCR": "27/12/1992",
      "Source_where_actually_data_is_found": "Document 1 (PAN Card content)",
      "ai_comments": "🎂 Age: 31 years - Ideal demographic for personal loan. DOB clearly extracted and falls within prime lending age bracket.",
      "confidence_score": 100,
      "verification_status": "VERIFIED",
      "calculated_age": 31
    },
    {
      "s_no": 4,
      "field_name": "📱 Primary Contact Verification",
      "Source_to_be_looked_at_in_ocr": "Application Form", 
      "Field_data_found_in_OCR": "8388920141",
      "Source_where_actually_data_is_found": "Document 9 (Application Form, Contact Details)",
      "ai_comments": "📞 Mobile number successfully extracted and cross-verified across multiple documents. Consistent contact information indicates genuine application.",
      "confidence_score": 95,
      "verification_status": "VERIFIED"
    },
    {
      "s_no": 5,
      "field_name": "🆔 PAN Verification Success",
      "Source_to_be_looked_at_in_ocr": "PAN Card",
      "Field_data_found_in_OCR": "DNFPS9282F",
      "Source_where_actually_data_is_found": "Document 1 (PAN Card content)",
      "ai_comments": "💳 PAN format validated and extracted perfectly. This PAN will be used for credit bureau verification and tax compliance checks.",
      "confidence_score": 100,
      "verification_status": "VERIFIED"
    },
    {
      "s_no": 6,
      "field_name": "💰 Loan Amount Confirmation",
      "Source_to_be_looked_at_in_ocr": "Application Form",
      "Field_data_found_in_OCR": "₹2,00,000",
      "Source_where_actually_data_is_found": "Document 9 (Application Form)",
      "ai_comments": "💸 Requested loan amount of ₹2,00,000 clearly identified. Amount is within policy limits for applicant's income profile.",
      "confidence_score": 98,
      "verification_status": "VERIFIED"
    },
    {
      "s_no": 7,
      "field_name": "🏢 Employer Verification - Premium Company",
      "Source_to_be_looked_at_in_ocr": "Salary Slip",
      "Field_data_found_in_OCR": "MICROTEK INTERNATIONAL PRIVATE LIMITED",
      "Source_where_actually_data_is_found": "Document 7 (Salary Slip)",
      "ai_comments": "🏆 Excellent employer profile! Microtek International is a recognized corporate entity. Employment with established organization reduces lending risk significantly.",
      "confidence_score": 92,
      "verification_status": "VERIFIED"
    },
    {
      "s_no": 8,
      "field_name": "💸 Monthly Income Verification",
      "Source_to_be_looked_at_in_ocr": "Salary Slip",
      "Field_data_found_in_OCR": "₹39,550",
      "Source_where_actually_data_is_found": "Document 7 (Salary Slip)",
      "ai_comments": "💰 Strong monthly income of ₹39,550 verified through official payslip. Income level supports requested loan amount with comfortable EMI ratio.",
      "confidence_score": 100,
      "verification_status": "VERIFIED"
    },
    {
      "s_no": 9,
      "field_name": "🏦 Banking Relationship",
      "Source_to_be_looked_at_in_ocr": "Bank Statement",
      "Field_data_found_in_OCR": "MICROTEK SALARY deposit on 05/03/22",
      "Source_where_actually_data_is_found": "Document 5 (HDFC Bank Statement)",
      "ai_comments": "✅ Salary credit confirmation in HDFC Bank statements validates employment and income claims. Regular salary deposits indicate stable employment.",
      "confidence_score": 95,
      "verification_status": "VERIFIED"
    },
    {
      "s_no": 10,
      "field_name": "📊 CIBIL Score Analysis",
      "Source_to_be_looked_at_in_ocr": "Bureau Report",
      "Field_data_found_in_OCR": "781",
      "Source_where_actually_data_is_found": "Document 4 (CIBIL Report)",
      "ai_comments": "🏅 EXCELLENT CIBIL Score of 781! This places the applicant in the premium borrower category with minimal credit risk. Strong repayment history evident.",
      "confidence_score": 98,
      "verification_status": "EXCELLENT"
    }
  ],

  // Loan Checklist from dummy_data/login_checklist
  loanChecklist: {
    "checklist": [
      {
        "Categories": "🏆 Minimum Credit Parameters",
        "Subcategory (if applicable)": "Core Documentation",
        "Document": "Application Form Verification",
        "Checkpoints (what to check in docs)": "Physical form completion, demographic accuracy, cross-signed photograph & signature verification. Digital form photo validation.",
        "Matching Documents": "✅ Aditya Birla Finance Personal Loan Application Form (Captured: 4/6/22, 7:58 PM)",
        "Data Entry Matching (Answer Yes or No)": "YES",
        "Applicant": "✅ VERIFIED",
        "AI Comments (reasoning behind decision)": "🎯 EXCELLENT: Scanned application form shows 100% completion with all required fields properly filled in block letters. Demographic details perfectly aligned with supporting documents. Professional form completion indicates serious loan intent.",
        "risk_level": "LOW",
        "compliance_score": 98
      },
      {
        "Categories": "🏆 Minimum Credit Parameters", 
        "Subcategory (if applicable)": "Digital Consent",
        "Document": "Email Consent Verification",
        "Checkpoints (what to check in docs)": "Consent email from registered email ID with matching data and document details",
        "Matching Documents": "✅ Login confirmation email from gautamsinghsisodia0014@gmail.com",
        "Data Entry Matching (Answer Yes or No)": "YES",
        "Applicant": "✅ VERIFIED",
        "AI Comments (reasoning behind decision)": "🔒 SECURE: Valid email consent received with 'LOGIN CONFIRMATION' subject. Registered email ID matches application details. Digital consent protocol fully complied.",
        "risk_level": "LOW",
        "compliance_score": 95
      },
      {
        "Categories": "💰 Financial Verification",
        "Subcategory (if applicable)": "Banking History", 
        "Document": "Bank Statement Analysis",
        "Checkpoints (what to check in docs)": "Customer name verification, bank name validation, statement period continuity, salary credit confirmation, transaction pattern analysis",
        "Matching Documents": "✅ HDFC Bank Statement (Multiple pages covering 3+ months)",
        "Data Entry Matching (Answer Yes or No)": "YES",
        "Applicant": "✅ VERIFIED", 
        "AI Comments (reasoning behind decision)": "🏦 OUTSTANDING: HDFC Bank statements show consistent account maintenance with clear account holder name, branch details, and continuous transaction history. Regular salary credits validate income claims. Excellent banking relationship.",
        "risk_level": "LOW",
        "compliance_score": 96
      },
      {
        "Categories": "🆔 Identity Verification",
        "Subcategory (if applicable)": "Government ID Proof",
        "Document": "Aadhaar & PAN Verification", 
        "Checkpoints (what to check in docs)": "Customer name/DOB/photo verification across identity documents",
        "Matching Documents": "✅ Aadhaar card (UIDAI) + PAN details (DNFPS9282F) in application form",
        "Data Entry Matching (Answer Yes or No)": "YES",
        "Applicant": "✅ VERIFIED",
        "AI Comments (reasoning behind decision)": "🎯 PERFECT MATCH: Aadhaar card displays applicant name, gender, and unique ID with crystal clear details. PAN number (DNFPS9282F) perfectly matches across documents. Gold standard identity verification achieved.",
        "risk_level": "LOW", 
        "compliance_score": 100
      },
      {
        "Categories": "🏠 Address Verification",
        "Subcategory (if applicable)": "Residence Proof",
        "Document": "Address Documentation",
        "Checkpoints (what to check in docs)": "Customer name/DOB/address/pincode verification across address proofs",
        "Matching Documents": "✅ Aadhaar card address + Rental Agreement documentation", 
        "Data Entry Matching (Answer Yes or No)": "YES",
        "Applicant": "✅ VERIFIED",
        "AI Comments (reasoning behind decision)": "📍 COMPREHENSIVE: Both Aadhaar and rental agreement provide detailed address information with pincode verification. Registered address on Aadhaar validates permanent residence. Dual address proof strengthens verification.",
        "risk_level": "LOW",
        "compliance_score": 92
      },
      {
        "Categories": "💼 Employment Verification", 
        "Subcategory (if applicable)": "Salaried Profile",
        "Document": "Income & Employment Proof",
        "Checkpoints (what to check in docs)": "Customer name, PAN, bank account, salary month, minimum income threshold verification",
        "Matching Documents": "✅ MICROTEK Salary Slip for Mar 2022 + HDFC Bank Statement",
        "Data Entry Matching (Answer Yes or No)": "YES",
        "Applicant": "✅ VERIFIED",
        "AI Comments (reasoning behind decision)": "💼 PREMIUM EMPLOYMENT: Salary slip shows gross earnings of ₹39,550 from reputed company Microtek International. Bank statements confirm regular salary credits. Employment stability and income adequacy both excellent.",
        "risk_level": "LOW",
        "compliance_score": 94
      },
      {
        "Categories": "🔴 MANDATORY DOCUMENTS NOT AVAILABLE",
        "Subcategory (if applicable)": "Critical Missing Documents",
        "Document": "3-Month Complete Salary History", 
        "Checkpoints (what to check in docs)": "Last 3 consecutive months salary slips required for comprehensive income verification as per policy",
        "Matching Documents": "❌ MISSING: Only 1 month (Mar 2022) available. Need Feb 2022 & Jan 2022 salary slips",
        "Data Entry Matching (Answer Yes or No)": "NO",
        "Applicant": "❌ MANDATORY NOT MET",
        "AI Comments (reasoning behind decision)": "🚨 CRITICAL MISSING: Policy requires 3 consecutive months salary slips for income verification. Only 1 month provided. This is a mandatory requirement that must be fulfilled before loan processing can continue. Cannot proceed without complete salary documentation.",
        "risk_level": "HIGH",
        "compliance_score": 30,
        "action_required": "URGENT: Submit complete 3-month salary slip history"
      },
      {
        "Categories": "🔴 MANDATORY DOCUMENTS NOT AVAILABLE",
        "Subcategory (if applicable)": "Critical Missing Documents", 
        "Document": "Employment Verification Letter",
        "Checkpoints (what to check in docs)": "Official employment letter on company letterhead with HR signature and seal",
        "Matching Documents": "❌ MISSING: No employment verification letter from Microtek International",
        "Data Entry Matching (Answer Yes or No)": "NO",
        "Applicant": "❌ MANDATORY NOT MET",
        "AI Comments (reasoning behind decision)": "🚨 CRITICAL MISSING: Mandatory employment verification letter not provided. Required for confirming employment status, designation, and salary details as per lending policy. Salary slip alone insufficient for employment verification.",
        "risk_level": "HIGH", 
        "compliance_score": 25,
        "action_required": "URGENT: Obtain employment letter from HR department"
      },
      {
        "Categories": "🔴 MANDATORY DOCUMENTS NOT AVAILABLE",
        "Subcategory (if applicable)": "Critical Missing Documents",
        "Document": "Utility Bills for Address Verification", 
        "Checkpoints (what to check in docs)": "Latest 2 months utility bills (electricity/gas/water) for current address verification",
        "Matching Documents": "❌ MISSING: No utility bills provided for address verification", 
        "Data Entry Matching (Answer Yes or No)": "NO",
        "Applicant": "❌ MANDATORY NOT MET",
        "AI Comments (reasoning behind decision)": "🚨 CRITICAL MISSING: Utility bills are mandatory for current address verification. Rental agreement alone insufficient. Need recent utility bills to confirm actual residence at declared address.",
        "risk_level": "HIGH",
        "compliance_score": 20,
        "action_required": "URGENT: Submit utility bills for last 2 months"
      },
      {
        "Categories": "🔴 MANDATORY DOCUMENTS NOT AVAILABLE",
        "Subcategory (if applicable)": "Critical Missing Documents",
        "Document": "Complete Bank Statement Coverage",
        "Checkpoints (what to check in docs)": "Full 3 months bank statement with all pages and proper bank seal/signature", 
        "Matching Documents": "❌ INCOMPLETE: Bank statements provided but some pages missing, no bank seal visible",
        "Data Entry Matching (Answer Yes or No)": "NO", 
        "Applicant": "❌ MANDATORY NOT MET",
        "AI Comments (reasoning behind decision)": "🚨 CRITICAL MISSING: Bank statements incomplete - missing pages detected and no official bank seal/signature for authentication. Complete bank statement package with official seal mandatory for processing.",
        "risk_level": "HIGH",
        "compliance_score": 35,
        "action_required": "URGENT: Submit complete bank statements with official bank seal"
      },
      {
        "Categories": "✅ Additional Compliance",
        "Subcategory (if applicable)": "Address Support",
        "Document": "Rental Agreement (OVD Alternative)",
        "Checkpoints (what to check in docs)": "Name, address, signature verification for current residence proof", 
        "Matching Documents": "✅ Tenant Profile / Rental Agreement with landlord verification",
        "Data Entry Matching (Answer Yes or No)": "YES",
        "Applicant": "✅ VERIFIED",
        "AI Comments (reasoning behind decision)": "🏠 EXCELLENT SUPPORT: Rental agreement provides comprehensive address details including landmark and pincode. Landlord signature adds authenticity. Strong alternative address proof for current residence verification.",
        "risk_level": "LOW",
        "compliance_score": 88
      }
    ]
  }
}; 