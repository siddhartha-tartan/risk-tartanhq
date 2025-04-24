import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Get the file path from the query parameters
    const url = new URL(request.url);
    const filePath = url.searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'Missing required parameter: path' },
        { status: 400 }
      );
    }

    // Prevent path traversal attacks
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
    
    // Get the full path to the file
    const fullPath = path.join(process.cwd(), 'uploads', normalizedPath);

    // Check if the file exists
    if (!existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
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
      return new NextResponse(await readFile(fullPath), {
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