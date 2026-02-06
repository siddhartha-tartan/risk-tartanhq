const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

// Sample document contents (simplified for demo)
const sampleDocuments = {
  'PAN.jpeg': 'Sample PAN Card - GOUTAM SINGH, DOB: 27/12/1992, PAN: DNFPS9282F',
  'Salary_March.pdf': 'Sample Salary Slip - MICROTEK INTERNATIONAL, Goutam Singh, ₹39,550',
  'Bank_Statement.pdf': 'Sample HDFC Bank Statement - Account: 50100344352056, Balance: ₹3,096.03',
  'CIBIL_Report.pdf': 'Sample CIBIL Report - Score: 781, Total Accounts: 60',
  'Rent_Agreement.pdf': 'Sample Rent Agreement - Flat No: 35, Rent: ₹8,000/month',
  'Increment_Letter.pdf': 'Sample Increment Letter - Promotion to Area Sales Manager'
};

function createDemoZip() {
  const zip = new AdmZip();
  
  // Add sample documents to ZIP
  Object.entries(sampleDocuments).forEach(([filename, content]) => {
    zip.addFile(filename, Buffer.from(content, 'utf8'));
  });
  
  // Create output directory if it doesn't exist
  const outputDir = path.join(__dirname, '..', 'public', 'samples');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write ZIP file
  const outputPath = path.join(outputDir, 'goutam.zip');
  zip.writeZip(outputPath);
  
  console.log(`Demo ZIP file created at: ${outputPath}`);
  console.log('File contents:');
  Object.keys(sampleDocuments).forEach(filename => {
    console.log(`  - ${filename}`);
  });
  
  console.log('\nTo test the demo:');
  console.log('1. Download goutam.zip from /public/samples/goutam.zip');
  console.log('2. Upload it to the system');
  console.log('3. Watch all 4 LLMs process the documents with realistic results');
}

// Run the script
createDemoZip(); 