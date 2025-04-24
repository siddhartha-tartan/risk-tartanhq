import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';

// S3 bucket name
const BUCKET_NAME = 'ai-policy-benchmark';

export async function POST(request: NextRequest) {
  const startTime = new Date().toISOString();
  console.log(`[${startTime}] Upload API route called`);
  
  try {
    const formData = await request.formData();
    const file: File | null = formData.get('zipFile') as unknown as File;

    if (!file) {
      console.error(`[${new Date().toISOString()}] No file uploaded`);
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    console.log(`[${new Date().toISOString()}] File received: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

    // Check if the file is a zip file
    if (file.type !== 'application/zip') {
      console.error(`[${new Date().toISOString()}] Invalid file type: ${file.type}`);
      return NextResponse.json(
        { error: 'Only ZIP files are allowed' },
        { status: 400 }
      );
    }

    // Generate a unique ID for the upload session
    const sessionId = uuidv4();
    const fileName = `${sessionId}_${file.name}`;
    console.log(`[${new Date().toISOString()}] Generated session ID: ${sessionId}`);

    // Create the uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads');
    console.log(`[${new Date().toISOString()}] Upload directory path: ${uploadDir}`);
    
    try {
      if (!existsSync(uploadDir)) {
        console.log(`[${new Date().toISOString()}] Creating uploads directory: ${uploadDir}`);
        await mkdir(uploadDir, { recursive: true });
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error creating uploads directory:`, error);
      // Continue anyway, as we'll catch the file write error if directory doesn't exist
    }

    // Save the file to the uploads directory
    const filePath = path.join(uploadDir, fileName);
    console.log(`[${new Date().toISOString()}] Saving file to: ${filePath}`);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, fileBuffer);
    console.log(`[${new Date().toISOString()}] File saved successfully, size: ${fileBuffer.length} bytes`);

    // Execute the Python script to upload the file to S3
    const pythonScriptPath = path.join(process.cwd(), 'scripts', 's3_upload.py');
    console.log(`[${new Date().toISOString()}] Executing Python script: ${pythonScriptPath}`);
    console.log(`[${new Date().toISOString()}] Command: python ${pythonScriptPath} ${filePath} ${BUCKET_NAME}`);

    if (!existsSync(pythonScriptPath)) {
      console.error(`[${new Date().toISOString()}] Python script not found at path: ${pythonScriptPath}`);
      return NextResponse.json(
        { error: 'Internal server error: Python script not found' },
        { status: 500 }
      );
    }
    
    return new Promise((resolve) => {
      // Use 'python3' if on macOS or Linux, fallback to 'python' otherwise
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      console.log(`[${new Date().toISOString()}] Using Python command: ${pythonCommand}`);
      
      const pythonProcess = spawn(pythonCommand, [pythonScriptPath, filePath, BUCKET_NAME]);
      
      let outputData = '';
      let errorData = '';
      
      pythonProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        console.log(`[${new Date().toISOString()}] Python stdout: ${chunk}`);
        outputData += chunk;
      });
      
      pythonProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        console.error(`[${new Date().toISOString()}] Python stderr: ${chunk}`);
        errorData += chunk;
      });
      
      pythonProcess.on('close', (code) => {
        console.log(`[${new Date().toISOString()}] Python process exited with code ${code}`);
        
        if (code !== 0) {
          console.error(`[${new Date().toISOString()}] Python script execution failed:`, errorData);
          return resolve(NextResponse.json(
            { error: 'File upload to S3 failed', details: errorData },
            { status: 500 }
          ));
        }
        
        try {
          console.log(`[${new Date().toISOString()}] Full Python output:`, outputData);
          // Try to extract JSON result from the output
          const jsonStartIndex = outputData.lastIndexOf('{');
          if (jsonStartIndex === -1) {
            throw new Error('No JSON found in Python output');
          }
          
          const jsonString = outputData.substring(jsonStartIndex);
          console.log(`[${new Date().toISOString()}] Extracted JSON string:`, jsonString);
          
          const jsonResult = JSON.parse(jsonString);
          console.log(`[${new Date().toISOString()}] Parsed JSON result:`, jsonResult);
          
          if (jsonResult.status === 'success') {
            console.log(`[${new Date().toISOString()}] Upload successful, returning response`);
            return resolve(NextResponse.json({
              success: true,
              message: 'File uploaded successfully',
              s3Key: fileName,
              s3Url: jsonResult.url
            }));
          } else {
            console.error(`[${new Date().toISOString()}] Upload failed with error:`, jsonResult.message);
            return resolve(NextResponse.json(
              { error: jsonResult.message || 'Unknown error' },
              { status: 500 }
            ));
          }
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error parsing Python script output:`, error);
          console.error(`[${new Date().toISOString()}] Raw output:`, outputData);
          return resolve(NextResponse.json(
            { error: 'Error processing upload result', details: outputData },
            { status: 500 }
          ));
        }
      });

      // Handle unexpected errors with the process
      pythonProcess.on('error', (error) => {
        console.error(`[${new Date().toISOString()}] Python process error:`, error);
        return resolve(NextResponse.json(
          { error: `Error executing Python process: ${error.message}` },
          { status: 500 }
        ));
      });
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error handling file upload:`, error);
    return NextResponse.json(
      { error: 'Error handling file upload' },
      { status: 500 }
    );
  }
} 