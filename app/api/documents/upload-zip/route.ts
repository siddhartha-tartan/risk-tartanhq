import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Lazy initialization of S3 client
let s3Client: S3Client | null = null;

function getS3Client() {
  if (!s3Client) {
    const region = process.env.AWS_REGION || 'ap-south-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    
    console.log(`[S3] Initializing client - Region: ${region}, AccessKey: ${accessKeyId ? 'Set' : 'MISSING'}, SecretKey: ${secretAccessKey ? 'Set' : 'MISSING'}`);
    
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
    }
    
    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return s3Client;
}

export async function POST(request: NextRequest) {
  const startTime = new Date().toISOString();
  console.log(`[${startTime}] Upload API route called`);
  
  let tempFilePath: string | null = null;
  
  try {
    // Check credentials first
    const bucketName = process.env.S3_BUCKET || 'ai-policy-benchmark';
    const awsRegion = process.env.AWS_REGION || 'ap-south-1';
    
    console.log(`[${new Date().toISOString()}] Config - Bucket: ${bucketName}, Region: ${awsRegion}`);
    console.log(`[${new Date().toISOString()}] AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? 'configured' : 'MISSING'}`);
    console.log(`[${new Date().toISOString()}] AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? 'configured' : 'MISSING'}`);
    
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { 
          error: 'AWS credentials not configured',
          details: 'Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in Vercel environment variables',
          awsKeySet: !!process.env.AWS_ACCESS_KEY_ID,
          awsSecretSet: !!process.env.AWS_SECRET_ACCESS_KEY
        },
        { status: 500 }
      );
    }
    
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
      // Get S3 client (lazy initialization)
      const client = getS3Client();
      
      // Upload to S3 using AWS SDK v3
      console.log(`[${new Date().toISOString()}] Starting S3 upload to bucket: ${bucketName}`);
      
      const uploadCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: 'application/zip',
      });

      await client.send(uploadCommand);
      
      const s3Url = `s3://${bucketName}/${fileName}`;
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
      console.error(`[${new Date().toISOString()}] S3 Error Name:`, s3Error.name);
      console.error(`[${new Date().toISOString()}] S3 Error Code:`, s3Error.Code || s3Error.$metadata?.httpStatusCode);
      console.error(`[${new Date().toISOString()}] Bucket: ${bucketName}, Region: ${awsRegion}`);
      
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
          details: s3Error.message || 'Unknown S3 error',
          errorCode: s3Error.name || s3Error.Code,
          bucket: bucketName,
          region: awsRegion
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
