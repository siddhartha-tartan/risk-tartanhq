import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getFromS3, getPresignedUrl, getContentType } from '@/utils/s3Client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  const source = searchParams.get('source') || 'local'; // 'local', 's3', or 'presigned'
  const s3Key = searchParams.get('s3Key'); // Optional S3 key if different from filename
  
  if (!filename) {
    console.log(`[PREVIEW API] ERROR: No filename provided in request`);
    return new Response('Filename parameter is required', { status: 400 });
  }

  console.log(`[PREVIEW API] REQUEST: Document preview requested for filename: "${filename}", source: "${source}"`);
  
  // If requesting presigned URL, return the URL instead of the file
  if (source === 'presigned') {
    try {
      const key = s3Key || filename;
      const url = await getPresignedUrl(key, 3600); // 1 hour expiry
      return NextResponse.json({ url, expiresIn: 3600 });
    } catch (error: any) {
      console.error(`[PREVIEW API] Error generating presigned URL:`, error);
      return new Response(`Error generating presigned URL: ${error.message}`, { status: 500 });
    }
  }
  
  // If requesting from S3, fetch directly
  if (source === 's3') {
    try {
      const key = s3Key || filename;
      console.log(`[PREVIEW API] Fetching from S3: ${key}`);
      const fileBuffer = await getFromS3(key);
      console.log(`[PREVIEW API] SERVING from S3: File fetched successfully, size: ${fileBuffer.length} bytes`);
      return serveFileResponse(fileBuffer, filename);
    } catch (error: any) {
      console.error(`[PREVIEW API] S3 error:`, error);
      return new Response(`File not found in S3: ${filename}`, { status: 404 });
    }
  }
  
  // Local file serving (for local development or temp directory in serverless)
  try {
    // Check temp directory first (for Vercel serverless)
    const tempDir = os.tmpdir();
    const tempUploadsDir = path.join(tempDir, 'uploads');
    
    // Also check traditional locations for backwards compatibility
    const localUploadsDir = path.join(process.cwd(), 'uploads');
    const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Try to find the file in various locations
    const searchLocations = [
      // Direct in temp uploads
      path.join(tempUploadsDir, filename),
      // Direct in local uploads
      path.join(localUploadsDir, filename),
    ];
    
    // First, try direct paths
    for (const filePath of searchLocations) {
      try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        console.log(`[PREVIEW API] SUCCESS: File found at: ${filePath}`);
        const fileBuffer = await fs.promises.readFile(filePath);
        console.log(`[PREVIEW API] SERVING: File read successfully, size: ${fileBuffer.length} bytes`);
        return serveFileResponse(fileBuffer, filename);
      } catch {
        continue;
      }
    }
    
    // If not found in direct paths, search in subdirectories
    const dirsToSearch = [tempUploadsDir, publicUploadsDir];
    
    for (const baseDir of dirsToSearch) {
      if (!fs.existsSync(baseDir)) continue;
      
      try {
        const subdirs = await fs.promises.readdir(baseDir);
        
        for (const subdir of subdirs) {
          const extractedFilePath = path.join(baseDir, subdir, filename);
          
          try {
            await fs.promises.access(extractedFilePath, fs.constants.F_OK);
            console.log(`[PREVIEW API] SUCCESS: File found in subdirectory: ${extractedFilePath}`);
            const fileBuffer = await fs.promises.readFile(extractedFilePath);
            console.log(`[PREVIEW API] SERVING: File read successfully, size: ${fileBuffer.length} bytes`);
            return serveFileResponse(fileBuffer, filename);
          } catch {
            continue;
          }
        }
      } catch (dirErr) {
        console.log(`[PREVIEW API] Could not read directory: ${baseDir}`);
        continue;
      }
    }
    
    // If not found locally, try S3 as fallback
    // Look for the file in S3 extracted folder
    console.log(`[PREVIEW API] File not found locally, trying S3 fallback...`);
    
    try {
      // Try to find the file in S3 by searching common patterns
      // The file might be in extracted/{sessionId}/{filename}
      const s3Patterns = [
        s3Key,  // Direct S3 key if provided
        `extracted/*/${filename}`,  // Pattern for extracted files
        filename,  // Direct filename
      ].filter(Boolean);
      
      // If s3Key is provided, use it directly
      if (s3Key) {
        console.log(`[PREVIEW API] Trying S3 with key: ${s3Key}`);
        const fileBuffer = await getFromS3(s3Key);
        console.log(`[PREVIEW API] SERVING from S3: File fetched successfully, size: ${fileBuffer.length} bytes`);
        return serveFileResponse(fileBuffer, filename);
      }
      
      // Try to extract sessionId from the URL path pattern /uploads/{sessionId}/{filename}
      const pathMatch = searchParams.get('path')?.match(/uploads\/([^/]+)\//);
      if (pathMatch) {
        const sessionId = pathMatch[1];
        const s3FileKey = `extracted/${sessionId}/${filename}`;
        console.log(`[PREVIEW API] Trying S3 with extracted key: ${s3FileKey}`);
        const fileBuffer = await getFromS3(s3FileKey);
        console.log(`[PREVIEW API] SERVING from S3: File fetched successfully, size: ${fileBuffer.length} bytes`);
        return serveFileResponse(fileBuffer, filename);
      }
    } catch (s3Error) {
      console.log(`[PREVIEW API] S3 fallback also failed:`, s3Error);
    }
    
    // If we get here, the file wasn't found anywhere
    console.log(`[PREVIEW API] NOT FOUND: File "${filename}" not found in any location (local or S3)`);
    return new Response(`File not found: ${filename}`, { status: 404 });
    
  } catch (error) {
    console.error(`[PREVIEW API] ERROR: Exception while serving document preview for ${filename}:`, error);
    return new Response(`File not found: ${filename}`, { status: 404 });
  }
}

// Helper function to create the response with appropriate headers
function serveFileResponse(fileBuffer: Buffer, filename: string) {
  const headers = new Headers();
  
  // Set content type based on file extension
  const contentType = getContentType(filename);
  headers.set('Content-Type', contentType);
  
  // Add cache control headers to prevent caching
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  headers.set('Surrogate-Control', 'no-store');
  
  // Add a timestamp header
  headers.set('X-Timestamp', Date.now().toString());
  
  return new Response(fileBuffer, { headers });
}
