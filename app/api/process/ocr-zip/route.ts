import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import { writeFile, mkdir, rm, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import AdmZip from 'adm-zip';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

// OCR API configuration from environment variables
const OCR_API_URL = process.env.OCR_API_URL || 'https://nc3y3gmff4.execute-api.ap-south-1.amazonaws.com/v1/api/v1/cam_ocr';

// Hardcoded OCR API authentication credentials
const OCR_API_USERNAME = 'chat@service.user';
const OCR_API_PASSWORD = 'chat@123';
const OCR_API_KEY = '9ac4a1af6ba1ad743133ae7d328969412717e4ee67132ad0e8b2212bf2e169e2';
const OCR_ORGANIZATION_ID = 'e47904cc-c5e6-4811-a7e8-34568ec87267';

// S3 configuration
const BUCKET_NAME = process.env.S3_BUCKET || 'ai-policy-benchmark';
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';

// Initialize S3 client
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Call OCR API directly using fetch (replaces Python script)
async function callOcrApi(requestId: string, bucketName: string, s3Key: string) {
  console.log(`[OCR API] Starting OCR processing with request_id=${requestId}, bucket=${bucketName}, s3_key=${s3Key}`);

  const payload = {
    request_id: requestId,
    request_type: 'cam_ocr',
    bucket_name: bucketName,
    s3_key: s3Key,
    pre_signed_download_url: null
  };

  console.log(`[OCR API] Sending request to: ${OCR_API_URL}`);
  console.log(`[OCR API] Request payload:`, JSON.stringify(payload));

  try {
    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      headers: {
        'Username': OCR_API_USERNAME,
        'Password': OCR_API_PASSWORD,
        'x-api-key': OCR_API_KEY,
        'organization-id': OCR_ORGANIZATION_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log(`[OCR API] Response status code: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[OCR API] Error response: ${errorText.substring(0, 500)}...`);
      throw new Error(`OCR API returned status ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const responseText = await response.text();
    console.log(`[OCR API] Response text length: ${responseText.length}`);

    try {
      const responseJson = JSON.parse(responseText);

      // Check if response is an error message even with 200 status
      if (responseJson.status_code && responseJson.status_code !== '200') {
        throw new Error(`OCR API error: ${responseJson.message || 'Unknown error'}`);
      }

      // Check if it looks like valid OCR data
      if (Object.keys(responseJson).length === 0) {
        throw new Error('OCR API returned empty JSON object');
      }

      console.log(`[OCR API] Successfully extracted OCR data for ${Object.keys(responseJson).length} files`);
      return responseJson;

    } catch (parseError: any) {
      console.error(`[OCR API] JSON parse error:`, parseError);
      throw new Error(`Failed to parse OCR API response: ${parseError.message}`);
    }

  } catch (fetchError: any) {
    console.error(`[OCR API] Fetch error:`, fetchError);
    throw new Error(`OCR API request failed: ${fetchError.message}`);
  }
}

// Add retry mechanism for OCR API call
async function callOcrApiWithRetry(s3Key: string, maxRetries = 2) {
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount <= maxRetries) {
    try {
      console.log(`OCR API call attempt ${retryCount + 1} of ${maxRetries + 1}`);

      // Generate a unique request ID
      const requestId = uuidv4();

      // Call OCR API directly
      const ocrResult = await callOcrApi(requestId, BUCKET_NAME, s3Key);

      return {
        result: ocrResult,
        requestId
      };

    } catch (err: any) {
      lastError = err;
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
  throw lastError || new Error('OCR API call failed after multiple retries');
}

// Extract files from ZIP stored in S3 to temp directory
async function extractFilesFromS3Zip(s3Key: string, requestId: string) {
  console.log(`Extracting files from S3 ZIP: ${s3Key}`);

  // Create a temp directory for extracted files
  const tempDir = os.tmpdir();
  const extractDir = path.join(tempDir, 'uploads', requestId);
  await mkdir(extractDir, { recursive: true });

  try {
    // Download ZIP from S3
    console.log(`Downloading ZIP from S3 bucket: ${BUCKET_NAME}, key: ${s3Key}`);

    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    const s3Response = await s3Client.send(getCommand);

    if (!s3Response.Body) {
      throw new Error('S3 response body is empty');
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const stream = s3Response.Body as AsyncIterable<Uint8Array>;
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const zipBuffer = Buffer.concat(chunks);

    console.log(`Downloaded ZIP file, size: ${zipBuffer.length} bytes`);

    // IMPORTANT: Log warning for suspiciously small files
    if (zipBuffer.length < 10000) {
      console.warn(`⚠️ WARNING: Downloaded ZIP is suspiciously small (${zipBuffer.length} bytes). Expected real documents to be larger. S3 Key: ${s3Key}`);
    }

    // Save ZIP to temp location for extraction
    const tempZipPath = path.join(tempDir, `${requestId}_temp.zip`);
    await writeFile(tempZipPath, zipBuffer);

    // Extract using AdmZip
    const zip = new AdmZip(tempZipPath);
    const zipEntries = zip.getEntries();
    console.log(`Found ${zipEntries.length} total entries in ZIP file`);

    // Extract files and track valid ones
    const validFiles: Array<{ name: string, path: string, type: string, s3Key?: string }> = [];
    const skippedFiles: Array<{ name: string, reason: string }> = [];

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

        if (existsSync(targetPath)) {
          // Upload extracted file to S3 for persistence
          try {
            const fileContent = await readFile(targetPath);
            const s3FileKey = `extracted/${requestId}/${fileName}`;

            await s3Client.send(new PutObjectCommand({
              Bucket: BUCKET_NAME,
              Key: s3FileKey,
              Body: fileContent,
              ContentType: fileType,
            }));

            validFiles.push({
              name: fileName,
              path: `/uploads/${requestId}/${fileName}`,
              s3Key: s3FileKey,  // Add S3 key for preview
              type: fileType
            });
            console.log(`Extracted and uploaded to S3: ${fileName} -> ${s3FileKey}`);
          } catch (uploadError) {
            console.error(`Failed to upload ${fileName} to S3:`, uploadError);
            // Still include the file but without S3 key
            validFiles.push({
              name: fileName,
              path: `/uploads/${requestId}/${fileName}`,
              type: fileType
            });
          }
        } else {
          console.error(`Failed to extract file ${fileName} to ${targetPath}`);
          skippedFiles.push({ name: fileName, reason: 'extraction failed' });
        }
      } else {
        console.log(`Skipping unsupported file type: ${fileName}`);
        skippedFiles.push({ name: fileName, reason: 'unsupported file type' });
      }
    }

    // Clean up temp zip file
    try {
      await rm(tempZipPath, { force: true });
    } catch (cleanupError) {
      console.error('Failed to clean up temp zip file:', cleanupError);
    }

    console.log(`Extracted ${validFiles.length} valid files, skipped ${skippedFiles.length} files`);

    if (validFiles.length === 0) {
      // Clean up the empty directory before throwing
      try {
        await rm(extractDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error(`Failed to clean up directory: ${cleanupError}`);
      }

      if (skippedFiles.length === 0) {
        throw new Error('ZIP file is empty or contains no files');
      } else {
        const reasons = Array.from(new Set(skippedFiles.map(f => f.reason)));
        throw new Error(`No valid files found in ZIP. Skipped ${skippedFiles.length} files due to: ${reasons.join(', ')}`);
      }
    }

    return { validFiles, extractDir };

  } catch (error: any) {
    // Clean up any partially extracted files
    try {
      if (existsSync(extractDir)) {
        await rm(extractDir, { recursive: true, force: true });
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

async function cleanupLocalFiles(extractDir: string) {
  try {
    console.log(`Starting cleanup of local files: ${extractDir}`);

    // Delete the extracted files directory
    if (existsSync(extractDir)) {
      await rm(extractDir, { recursive: true, force: true });
      console.log(`Deleted extracted files directory: ${extractDir}`);
    }

    console.log(`Cleanup completed successfully`);
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

    console.log(`[OCR ROUTE DEBUG] Received s3Key: "${s3Key}"`);

    let extractDir = '';

    try {
      // Call OCR API with retry logic
      const ocrResult = await callOcrApiWithRetry(s3Key);

      // Extract files from S3 ZIP for preview purposes
      const { validFiles, extractDir: dir } = await extractFilesFromS3Zip(s3Key, ocrResult.requestId);
      extractDir = dir;

      // Schedule cleanup after response is sent
      // Note: In serverless, we should clean up immediately since the function will terminate
      setTimeout(() => cleanupLocalFiles(extractDir), 100);

      return NextResponse.json({
        success: true,
        result: ocrResult.result,
        localFiles: validFiles
      });

    } catch (ocrError: any) {
      console.error('OCR processing error after retries:', ocrError);

      // Clean up if we have an extract directory
      if (extractDir) {
        setTimeout(() => cleanupLocalFiles(extractDir), 100);
      }

      // Format a user-friendly error message
      let errorMessage = 'OCR processing failed after multiple retries.';

      if (ocrError.message.includes('OCR API')) {
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
