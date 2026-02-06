import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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

export async function POST(request: NextRequest) {
  const startTime = new Date().toISOString();
  console.log(`[${startTime}] Upload API route called`);
  
  let tempFilePath: string | null = null;
  
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
    if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
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

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    console.log(`[${new Date().toISOString()}] File buffer created, size: ${fileBuffer.length} bytes`);

    // Use /tmp directory for temporary storage (works in Vercel serverless)
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, fileName);
    
    try {
      // Save to temp directory (needed for some processing operations)
      await writeFile(tempFilePath, fileBuffer);
      console.log(`[${new Date().toISOString()}] File saved to temp: ${tempFilePath}`);
    } catch (tempWriteError) {
      console.error(`[${new Date().toISOString()}] Error writing to temp:`, tempWriteError);
      // Continue anyway - we can still upload to S3 directly from buffer
    }

    try {
      // Upload to S3 using AWS SDK v3
      console.log(`[${new Date().toISOString()}] Starting S3 upload to bucket: ${BUCKET_NAME}`);
      
      const uploadCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: 'application/zip',
      });

      await s3Client.send(uploadCommand);
      
      const s3Url = `s3://${BUCKET_NAME}/${fileName}`;
      console.log(`[${new Date().toISOString()}] Upload successful: ${s3Url}`);

      // Clean up temp file if it exists
      if (tempFilePath && existsSync(tempFilePath)) {
        try {
          await unlink(tempFilePath);
          console.log(`[${new Date().toISOString()}] Cleaned up temp file`);
        } catch (cleanupError) {
          console.error(`[${new Date().toISOString()}] Error cleaning up temp file:`, cleanupError);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'File uploaded successfully',
        s3Key: fileName,
        s3Url: s3Url,
      });

    } catch (s3Error: any) {
      console.error(`[${new Date().toISOString()}] S3 upload failed:`, s3Error);
      
      // Clean up temp file on error
      if (tempFilePath && existsSync(tempFilePath)) {
        try {
          await unlink(tempFilePath);
        } catch (cleanupError) {
          console.error(`[${new Date().toISOString()}] Error cleaning up temp file:`, cleanupError);
        }
      }

      return NextResponse.json(
        { 
          error: 'File upload to S3 failed', 
          details: s3Error.message || 'Unknown S3 error'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error handling file upload:`, error);
    
    // Clean up temp file on error
    if (tempFilePath && existsSync(tempFilePath)) {
      try {
        await unlink(tempFilePath);
      } catch (cleanupError) {
        console.error(`[${new Date().toISOString()}] Error cleaning up temp file:`, cleanupError);
      }
    }

    return NextResponse.json(
      { error: 'Error handling file upload', details: error.message },
      { status: 500 }
    );
  }
}
