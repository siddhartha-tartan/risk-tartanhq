import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { documentStore } from '@/utils/documentStore';
import { getFromS3, getContentType } from '@/utils/s3Client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  const sessionId = searchParams.get('session');
  const source = searchParams.get('source') || 'local'; // 'local' or 's3'
  const s3Key = searchParams.get('s3Key'); // Optional S3 key
  
  if (!filename) {
    console.log(`[SESSION PREVIEW API] ERROR: No filename provided in request`);
    return new Response('Filename parameter is required', { status: 400 });
  }

  console.log(`[SESSION PREVIEW API] REQUEST: Document preview requested for filename: "${filename}"`);
  console.log(`[SESSION PREVIEW API] SESSION: Using session ID: ${sessionId || 'none'}`);
  console.log(`[SESSION PREVIEW API] SOURCE: ${source}`);
  
  // If requesting from S3, fetch directly
  if (source === 's3' && s3Key) {
    try {
      console.log(`[SESSION PREVIEW API] Fetching from S3: ${s3Key}`);
      const fileBuffer = await getFromS3(s3Key);
      console.log(`[SESSION PREVIEW API] SERVING from S3: File fetched successfully, size: ${fileBuffer.length} bytes`);
      return serveFileResponse(fileBuffer, filename);
    } catch (error: any) {
      console.error(`[SESSION PREVIEW API] S3 error:`, error);
      return new Response(`File not found in S3: ${filename}`, { status: 404 });
    }
  }
  
  try {
    // Get all documents from the store for debugging
    const allDocuments = documentStore.getDocuments();
    console.log(`[SESSION PREVIEW API] Found ${allDocuments.length} documents in store`);
    
    // First, try to find an exact document match by filename
    let targetDoc = allDocuments.find(doc => doc.originalFilename === filename);
    
    // If no match by filename, try to find a close match (case insensitive)
    if (!targetDoc) {
      const lowerFilename = filename.toLowerCase();
      targetDoc = allDocuments.find(doc => 
        doc.originalFilename.toLowerCase() === lowerFilename);
    }
    
    if (targetDoc) {
      console.log(`[SESSION PREVIEW API] FOUND: Document "${filename}" in document store`);
      
      // Try direct path from document if available
      if (targetDoc.filePath) {
        try {
          console.log(`[SESSION PREVIEW API] Trying filePath: ${targetDoc.filePath}`);
          await fs.promises.access(targetDoc.filePath, fs.constants.F_OK);
          const fileBuffer = await fs.promises.readFile(targetDoc.filePath);
          console.log(`[SESSION PREVIEW API] SERVING from filePath: File read successfully, size: ${fileBuffer.length} bytes`);
          return serveFileResponse(fileBuffer, filename);
        } catch (fileErr) {
          console.error(`[SESSION PREVIEW API] FILE ERROR: Could not access file at path ${targetDoc.filePath}:`, fileErr);
        }
      }
      
      // Try thumbnailUrl if available
      if (targetDoc.thumbnailUrl) {
        try {
          const urlPath = targetDoc.thumbnailUrl.startsWith('/') ? 
            targetDoc.thumbnailUrl.substring(1) : targetDoc.thumbnailUrl;
          const thumbnailPath = path.join(process.cwd(), urlPath);
          
          console.log(`[SESSION PREVIEW API] Trying thumbnailUrl: ${thumbnailPath}`);
          await fs.promises.access(thumbnailPath, fs.constants.F_OK);
          const fileBuffer = await fs.promises.readFile(thumbnailPath);
          console.log(`[SESSION PREVIEW API] SERVING from thumbnailUrl: File read successfully, size: ${fileBuffer.length} bytes`);
          return serveFileResponse(fileBuffer, filename);
        } catch (fileErr) {
          console.error(`[SESSION PREVIEW API] FILE ERROR: Could not access file using thumbnailUrl:`, fileErr);
        }
      }
    } else {
      console.log(`[SESSION PREVIEW API] NOT FOUND: Document "${filename}" not found in document store`);
    }
    
    // Fallback: Search in temp and local directories
    const tempDir = os.tmpdir();
    const searchDirs = [
      path.join(tempDir, 'uploads'),
      path.join(process.cwd(), 'uploads'),
      path.join(process.cwd(), 'public', 'uploads'),
    ];
    
    for (const baseDir of searchDirs) {
      if (!fs.existsSync(baseDir)) continue;
      
      try {
        const subdirs = await fs.promises.readdir(baseDir);
        
        for (const subdir of subdirs) {
          const possibleFilePath = path.join(baseDir, subdir, filename);
          
          try {
            await fs.promises.access(possibleFilePath, fs.constants.F_OK);
            console.log(`[SESSION PREVIEW API] SUCCESS: File found in subdirectory: ${possibleFilePath}`);
            const fileBuffer = await fs.promises.readFile(possibleFilePath);
            console.log(`[SESSION PREVIEW API] SERVING: File read successfully, size: ${fileBuffer.length} bytes`);
            return serveFileResponse(fileBuffer, filename);
          } catch {
            continue;
          }
        }
      } catch (dirErr) {
        continue;
      }
    }
    
    // If we get here, the file wasn't found anywhere
    console.log(`[SESSION PREVIEW API] FINAL: Could not find "${filename}" in any location`);
    return new Response(`File not found: ${filename}`, { status: 404 });
  } catch (error) {
    console.error(`[SESSION PREVIEW API] ERROR: Exception while serving document preview for ${filename}:`, error);
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
