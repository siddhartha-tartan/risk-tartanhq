import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';
import { getFromS3, getContentType } from '@/utils/s3Client';

export async function GET(request: NextRequest) {
  try {
    // Get the file path from the query parameters
    const url = new URL(request.url);
    const filePath = url.searchParams.get('path');
    const source = url.searchParams.get('source') || 'local'; // 'local' or 's3'

    if (!filePath) {
      return NextResponse.json(
        { error: 'Missing required parameter: path' },
        { status: 400 }
      );
    }

    // Prevent path traversal attacks
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
    
    // If source is S3, fetch from S3
    if (source === 's3') {
      try {
        console.log(`[GET-FILE] Fetching from S3: ${normalizedPath}`);
        const fileBuffer = await getFromS3(normalizedPath);
        const contentType = getContentType(normalizedPath);
        
        // Try to parse as JSON if it looks like a JSON file
        if (contentType === 'application/json' || normalizedPath.endsWith('.json')) {
          try {
            const jsonData = JSON.parse(fileBuffer.toString('utf-8'));
            return NextResponse.json(jsonData);
          } catch {
            // Not valid JSON, return as binary
          }
        }
        
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': contentType,
          },
        });
      } catch (s3Error: any) {
        console.error(`[GET-FILE] S3 error: ${s3Error.message}`);
        return NextResponse.json(
          { error: 'File not found in S3' },
          { status: 404 }
        );
      }
    }
    
    // Check temp directory first (for Vercel serverless)
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, 'uploads', normalizedPath);
    
    // Also check the old uploads path for backwards compatibility in local dev
    const localPath = path.join(process.cwd(), 'uploads', normalizedPath);
    
    // Determine which path to use
    let fullPath: string | null = null;
    
    if (existsSync(tempPath)) {
      fullPath = tempPath;
      console.log(`[GET-FILE] Found file in temp: ${tempPath}`);
    } else if (existsSync(localPath)) {
      fullPath = localPath;
      console.log(`[GET-FILE] Found file in local uploads: ${localPath}`);
    }

    // Check if the file exists
    if (!fullPath) {
      console.error(`[GET-FILE] File not found: ${normalizedPath}`);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    try {
      // Read the file contents
      const fileContents = await readFile(fullPath, 'utf-8');
      
      // Try to parse it as JSON
      const jsonData = JSON.parse(fileContents);
      
      // Return the parsed JSON data
      return NextResponse.json(jsonData);
    } catch (parseError) {
      // If parsing fails, return the raw file contents
      console.error('Error parsing file as JSON:', parseError);
      const fileBuffer = await readFile(fullPath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });
    }
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json(
      { error: 'Error reading file' },
      { status: 500 }
    );
  }
}
