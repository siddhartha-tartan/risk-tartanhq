import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Note: This cleanup route is designed for serverless environments like Vercel.
// In Vercel, the filesystem is ephemeral and read-only (except /tmp).
// Files in /tmp are automatically cleaned up when the function instance terminates.
// This route is mainly useful for local development or long-running server environments.

// Function to get file age in hours
function getFileAgeInHours(filePath: string): number {
  const stats = fs.statSync(filePath);
  const fileModifiedTime = stats.mtime.getTime();
  const currentTime = new Date().getTime();
  const ageInHours = (currentTime - fileModifiedTime) / (1000 * 60 * 60);
  return ageInHours;
}

// Define the cleanup result type
type CleanupResult = {
  deleted: number;
  errors: number;
  message: string;
};

// Function to clean up temporary files
async function cleanupTempDirectory(ageThresholdHours = 1): Promise<CleanupResult> {
  try {
    const tempDir = os.tmpdir();
    const uploadsDir = path.join(tempDir, 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('Temp uploads directory does not exist, nothing to clean');
      return { 
        deleted: 0, 
        errors: 0, 
        message: 'Temp uploads directory does not exist' 
      };
    }

    const directories = fs.readdirSync(uploadsDir);
    let deletedCount = 0;
    let errorCount = 0;

    console.log(`Found ${directories.length} directories in temp uploads directory`);

    for (const dir of directories) {
      try {
        const dirPath = path.join(uploadsDir, dir);
        
        // Skip files, only process directories
        if (!fs.statSync(dirPath).isDirectory()) {
          continue;
        }
        
        const dirAge = getFileAgeInHours(dirPath);
        
        if (dirAge > ageThresholdHours) {
          console.log(`Deleting old directory: ${dir} (age: ${dirAge.toFixed(2)} hours)`);
          fs.rmSync(dirPath, { recursive: true, force: true });
          deletedCount++;
        }
      } catch (error) {
        console.error(`Error processing directory ${dir}:`, error);
        errorCount++;
      }
    }

    return {
      deleted: deletedCount,
      errors: errorCount,
      message: `Cleaned up ${deletedCount} directories older than ${ageThresholdHours} hours`
    };
  } catch (error) {
    console.error('Error cleaning up temp directory:', error);
    return {
      deleted: 0,
      errors: 1,
      message: `Error cleaning up: ${error}`
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get threshold from query params or use default (1 hour for temp files)
    const url = new URL(request.url);
    const ageThresholdHours = parseFloat(url.searchParams.get('ageThreshold') || '1');
    
    const results = {
      tempUploads: await cleanupTempDirectory(ageThresholdHours),
      totalDeleted: 0,
      totalErrors: 0,
      environment: process.env.VERCEL ? 'vercel' : 'local'
    };

    results.totalDeleted = results.tempUploads.deleted;
    results.totalErrors = results.tempUploads.errors;

    return NextResponse.json({
      success: true,
      results,
      message: `Cleanup completed. Deleted ${results.totalDeleted} items with ${results.totalErrors} errors.`,
      note: process.env.VERCEL 
        ? 'Running on Vercel - temp files are automatically cleaned up when function instances terminate.'
        : 'Running locally - manual cleanup of temp files.'
    });
  } catch (error) {
    console.error('Error in cleanup endpoint:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Error during cleanup operation',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
