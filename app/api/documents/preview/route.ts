import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  
  if (!filename) {
    console.log(`[PREVIEW API] ERROR: No filename provided in request`);
    return new Response('Filename parameter is required', { status: 400 });
  }

  // Primary location - direct uploads folder
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const primaryFilePath = path.join(uploadsDir, filename);

  console.log(`[PREVIEW API] REQUEST: Document preview requested for filename: "${filename}"`);
  console.log(`[PREVIEW API] SEARCH: Looking for file match at primary location: ${primaryFilePath}`);
  
  try {
    // First try - check in the direct uploads folder
    try {
      await fs.promises.access(primaryFilePath, fs.constants.F_OK);
      console.log(`[PREVIEW API] SUCCESS: File found at primary location: ${primaryFilePath}`);
      
      // Read and serve the file from primary location
      const fileBuffer = await fs.promises.readFile(primaryFilePath);
      console.log(`[PREVIEW API] SERVING: File read successfully from primary location, size: ${fileBuffer.length} bytes`);
      return serveFileResponse(fileBuffer, filename);
    } catch (err) {
      console.log(`[PREVIEW API] NOT FOUND: File does not exist at primary location: ${primaryFilePath}`);
      
      // If not found in primary location, search in public/uploads subdirectories
      console.log(`[PREVIEW API] SEARCH: Looking in extracted zip directories...`);
      const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
      
      try {
        // Read all subdirectories in public/uploads
        const subdirs = await fs.promises.readdir(publicUploadsDir);
        
        // Try each subdirectory
        for (const subdir of subdirs) {
          const extractedFilePath = path.join(publicUploadsDir, subdir, filename);
          
          try {
            await fs.promises.access(extractedFilePath, fs.constants.F_OK);
            console.log(`[PREVIEW API] SUCCESS: File found in extracted directory: ${extractedFilePath}`);
            
            // Read and serve the file from the extracted location
            const fileBuffer = await fs.promises.readFile(extractedFilePath);
            console.log(`[PREVIEW API] SERVING: File read successfully from extracted location, size: ${fileBuffer.length} bytes`);
            return serveFileResponse(fileBuffer, filename);
          } catch (fileErr) {
            // File not in this subdirectory, continue to next one
            continue;
          }
        }
        
        // If we get here, the file wasn't found in any subdirectory
        console.log(`[PREVIEW API] NOT FOUND: File "${filename}" not found in any extracted directory`);
        return new Response(`File not found: ${filename}`, { status: 404 });
      } catch (dirErr) {
        console.error(`[PREVIEW API] ERROR: Failed to read public/uploads directory:`, dirErr);
        return new Response(`File not found: ${filename}`, { status: 404 });
      }
    }
  } catch (error) {
    console.error(`[PREVIEW API] ERROR: Exception while serving document preview for ${filename}:`, error);
    return new Response(`File not found: ${filename}`, { status: 404 });
  }
}

// Helper function to create the response with appropriate headers
function serveFileResponse(fileBuffer: Buffer, filename: string) {
  const headers = new Headers();
  
  // Set content type based on file extension
  const extension = path.extname(filename).toLowerCase();
  if (extension === '.pdf') {
    headers.set('Content-Type', 'application/pdf');
  } else if (['.jpg', '.jpeg'].includes(extension)) {
    headers.set('Content-Type', 'image/jpeg');
  } else if (extension === '.png') {
    headers.set('Content-Type', 'image/png');
  } else {
    headers.set('Content-Type', 'application/octet-stream');
  }
  
  // Add cache control headers to prevent caching
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  headers.set('Surrogate-Control', 'no-store');
  
  // Add a random query parameter to the URL to bust cache
  const timestamp = Date.now();
  headers.set('X-Timestamp', timestamp.toString());
  
  return new Response(fileBuffer, { headers });
} 