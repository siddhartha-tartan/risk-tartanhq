import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import os from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';
import AdmZip from 'adm-zip';

const execPromise = promisify(exec);

// Add retry mechanism for OCR API call
async function callOcrApiWithRetry(s3Key: string, maxRetries = 2) {
  let retryCount = 0;
  let error = null;
  let extractedFiles = [];

  while (retryCount <= maxRetries) {
    try {
      console.log(`OCR API call attempt ${retryCount + 1} of ${maxRetries + 1}`);
      
      // Generate a unique request ID
      const requestId = crypto.randomUUID();
      
      // First extract files from the ZIP
      const localZipPath = path.join(process.cwd(), 'uploads', s3Key);
      extractedFiles = await extractFilesFromZip(localZipPath, requestId);
      console.log(`Successfully extracted ${extractedFiles.length} files for processing`);
      
      // Check if the Python script exists
      const scriptPath = path.join(process.cwd(), 'scripts', 'ocr_api.py');
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`OCR Python script not found at ${scriptPath}. Make sure the script exists.`);
      }
      
      // Call Python script to process the extracted files
      const ocrProcess = spawn('python3', [
        scriptPath, // Use absolute path
        requestId,
        'ai-policy-benchmark', // S3 bucket name
        s3Key
      ]);
      
      // Collect stdout and stderr
      let stdout = '';
      let stderr = '';
      
      ocrProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log('Python stdout chunk:', data.toString());
      });
      
      ocrProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error('Python stderr:', data.toString());
      });
      
      // Wait for process to complete
      const exitCode = await new Promise((resolve) => {
        ocrProcess.on('close', resolve);
      });
      
      console.log(`Python process exited with code ${exitCode}`);
      console.log(`Full Python stdout output length: ${stdout.length}`);
      console.log(`Python stdout preview: ${stdout.substring(0, 200)}...`);
      
      if (exitCode !== 0) {
        throw new Error(`OCR process failed with exit code ${exitCode}. Error: ${stderr}`);
      }
      
      // Try to extract JSON data from the stdout
      const stdoutLines = stdout.split('\n');
      console.log(`Found ${stdoutLines.length} lines in stdout`);
      
      let jsonData = null;
      
      // Look for a JSON line in the output
      for (let i = stdoutLines.length - 1; i >= 0; i--) {
        const line = stdoutLines[i].trim();
        if (line.startsWith('{') && line.endsWith('}')) {
          try {
            jsonData = JSON.parse(line);
            console.log(`Found JSON data on line ${i + 1} of ${stdoutLines.length} lines`);
            break;
          } catch (e) {
            console.log(`Line ${i + 1} looks like JSON but failed to parse:`, e);
          }
        }
      }
      
      // Check if we found valid OCR data
      if (jsonData) {
        // Check for error flag in JSON
        if (jsonData.error) {
          throw new Error(`OCR API error: ${jsonData.message || 'Unknown error'}`);
        }
        
        // For backward compatibility, try different properties
        const ocrResults = 
          jsonData.results || 
          jsonData.file_ocr_map || 
          jsonData.rawResponse || 
          jsonData;
        
        // Check for OCR data
        if (typeof ocrResults === 'object' && ocrResults !== null) {
          const fileCount = Object.keys(ocrResults).length;
          console.log(`OCR data contains information for ${fileCount} files`);
          
          if (fileCount > 0) {
            return {
              result: ocrResults,
              localFiles: extractedFiles // Use our extracted files here
            };
          }
        }
        
        throw new Error('OCR process completed but returned empty or invalid results');
      } else {
        throw new Error('Could not extract JSON data from OCR process output');
      }
      
    } catch (err) {
      error = err;
      console.error(`OCR API call failed (attempt ${retryCount + 1}):`, err);
      retryCount++;
      
      if (retryCount <= maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = 1000 * Math.pow(2, retryCount);
        console.log(`Retrying OCR API call in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we get here, all retries failed
  throw error || new Error('OCR API call failed after multiple retries');
}

// Add this function after the existing callOcrApiWithRetry function
async function extractFilesFromZip(zipPath: string, requestId: string) {
  console.log(`Extracting files from ZIP: ${zipPath}`);

  // Create a directory for extracted files
  const extractDir = path.join(process.cwd(), 'public', 'uploads', requestId);
  await fs.promises.mkdir(extractDir, { recursive: true });

  if (!fs.existsSync(zipPath)) {
    throw new Error(`ZIP file not found at ${zipPath}`);
  }

  try {
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();
    console.log(`Found ${zipEntries.length} total entries in ZIP file`);

    // Extract files and track valid ones
    const validFiles = [];
    const skippedFiles = [];

    for (const entry of zipEntries) {
      if (entry.isDirectory) {
        console.log(`Skipping directory entry: ${entry.name}`);
        continue;
      }

      const fileName = entry.name;
      
      // Skip macOS metadata files
      if (fileName.startsWith('._') || fileName.startsWith('.DS_Store') || fileName.startsWith('__MACOSX')) {
        console.log(`Skipping metadata file: ${fileName}`);
        skippedFiles.push({ name: fileName, reason: 'system metadata file' });
        continue;
      }
      
      const fileType = getFileType(fileName);
      
      // Only process supported file types
      if (fileType) {
        const targetPath = path.join(extractDir, fileName);
        zip.extractEntryTo(entry, extractDir, false, true);
        
        if (fs.existsSync(targetPath)) {
          validFiles.push({
            name: fileName,
            path: `/uploads/${requestId}/${fileName}`,
            type: fileType
          });
          console.log(`Extracted valid file: ${fileName} (${fileType})`);
        } else {
          console.error(`Failed to extract file ${fileName} to ${targetPath}`);
          skippedFiles.push({ name: fileName, reason: 'extraction failed' });
        }
      } else {
        console.log(`Skipping unsupported file type: ${fileName}`);
        skippedFiles.push({ name: fileName, reason: 'unsupported file type' });
      }
    }
    
    console.log(`Extracted ${validFiles.length} valid files, skipped ${skippedFiles.length} files`);
    
    if (validFiles.length === 0) {
      // Check what types of files were skipped
      const reasons = skippedFiles.map(f => f.reason);
      const uniqueReasons = Array.from(new Set(reasons));
      
      if (skippedFiles.length === 0) {
        // Clean up the empty directory before throwing
        try {
          await fs.promises.rm(extractDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.error(`Failed to clean up directory after finding empty ZIP: ${cleanupError}`);
        }
        throw new Error('ZIP file is empty or contains no files');
      } else {
        // Clean up the directory with invalid files before throwing
        try {
          await fs.promises.rm(extractDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.error(`Failed to clean up directory after finding no valid files: ${cleanupError}`);
        }
        throw new Error(`No valid files found in ZIP. Skipped ${skippedFiles.length} files due to: ${uniqueReasons.join(', ')}`);
      }
    }
    
    return validFiles;
  } catch (error: any) {
    // Clean up any partially extracted files
    try {
      if (fs.existsSync(extractDir)) {
        await fs.promises.rm(extractDir, { recursive: true, force: true });
        console.log(`Cleaned up extraction directory after error: ${extractDir}`);
      }
    } catch (cleanupError) {
      console.error(`Failed to clean up after extraction error: ${cleanupError}`);
    }

    if (error.message.includes('No valid files found')) {
      throw error; // Rethrow specific extraction errors
    }
    throw new Error(`Failed to extract files from ZIP: ${error.message}`);
  }
}

async function cleanupLocalFiles(requestId: string, s3Key: string) {
  try {
    console.log(`Starting cleanup of local files for request ${requestId}`);
    
    // Delete the extracted files directory
    const extractDir = path.join(process.cwd(), 'public', 'uploads', requestId);
    if (fs.existsSync(extractDir)) {
      await fs.promises.rm(extractDir, { recursive: true, force: true });
      console.log(`Deleted extracted files directory: ${extractDir}`);
    }
    
    // Delete the original zip file
    const zipPath = path.join(process.cwd(), 'uploads', s3Key);
    if (fs.existsSync(zipPath)) {
      await fs.promises.unlink(zipPath);
      console.log(`Deleted original zip file: ${zipPath}`);
    }
    
    console.log(`Cleanup completed successfully for request ${requestId}`);
  } catch (error) {
    console.error(`Error during cleanup: ${error}`);
    // We don't throw here to avoid failing the request if cleanup fails
  }
}

export async function POST(request: NextRequest) {
  try {
    // Extract s3Key from request body
    const { s3Key } = await request.json();
    
    if (!s3Key) {
      return NextResponse.json({ error: 'No S3 key provided' }, { status: 400 });
    }
    
    let requestId = '';
    try {
      // Call OCR API with retry logic
      const ocrResult = await callOcrApiWithRetry(s3Key);
      
      // Extract requestId from the first file path (if any files were extracted)
      if (ocrResult.localFiles && ocrResult.localFiles.length > 0) {
        const firstFilePath = ocrResult.localFiles[0].path;
        requestId = firstFilePath.split('/')[2]; // Format is /uploads/requestId/filename
      }
      
      // Clean up local files
      if (requestId) {
        // Use setTimeout to ensure cleanup happens after response is sent
        setTimeout(() => cleanupLocalFiles(requestId, s3Key), 100);
      }
      
      return NextResponse.json({
        success: true,
        result: ocrResult.result,
        localFiles: ocrResult.localFiles
      });
    } catch (ocrError: any) {
      console.error('OCR processing error after retries:', ocrError);
      
      // Try to extract requestId from error context if possible
      // This is a best effort attempt to clean up even if processing failed
      try {
        if (ocrError.localFiles && ocrError.localFiles.length > 0) {
          const firstFilePath = ocrError.localFiles[0].path;
          requestId = firstFilePath.split('/')[2];
          
          if (requestId) {
            setTimeout(() => cleanupLocalFiles(requestId, s3Key), 100);
          }
        }
      } catch (cleanupError) {
        console.error('Failed to extract requestId for cleanup:', cleanupError);
      }
      
      // Format a user-friendly error message
      let errorMessage = 'OCR processing failed after multiple retries.';
      
      if (ocrError.message.includes('can\'t open file') || 
          ocrError.message.includes('No such file')) {
        errorMessage = 'OCR setup error: OCR processing script not found. Please contact support.';
      } else if (ocrError.message.includes('OCR process failed with exit code')) {
        errorMessage = 'OCR processing failed. The service may be temporarily unavailable.';
      }
      
      // Return specific error for OCR failure
      return NextResponse.json({ 
        success: false, 
        error: errorMessage,
        technicalDetails: ocrError.message,
        actionRequired: 'Please try uploading the file again or contact support if the issue persists.'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error processing request:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Error processing request' 
    }, { status: 500 });
  }
}

// Helper function to get MIME type from file extension
function getFileType(fileName: string): string | null {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    default:
      return null;
  }
}