import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

// Function to clean up uploaded ZIP files older than a threshold
async function cleanupUploadsDirectory(ageThresholdHours = 24): Promise<CleanupResult> {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      console.log('Uploads directory does not exist, nothing to clean');
      return { 
        deleted: 0, 
        errors: 0, 
        message: 'Uploads directory does not exist' 
      };
    }

    const files = fs.readdirSync(uploadsDir);
    let deletedCount = 0;
    let errorCount = 0;

    console.log(`Found ${files.length} files in uploads directory`);

    for (const file of files) {
      try {
        const filePath = path.join(uploadsDir, file);
        
        // Skip directories and non-zip files
        if (fs.statSync(filePath).isDirectory() || !file.endsWith('.zip')) {
          continue;
        }
        
        const fileAge = getFileAgeInHours(filePath);
        
        if (fileAge > ageThresholdHours) {
          console.log(`Deleting old file: ${file} (age: ${fileAge.toFixed(2)} hours)`);
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
        errorCount++;
      }
    }

    return {
      deleted: deletedCount,
      errors: errorCount,
      message: `Cleaned up ${deletedCount} files older than ${ageThresholdHours} hours`
    };
  } catch (error) {
    console.error('Error cleaning up uploads directory:', error);
    return {
      deleted: 0,
      errors: 1,
      message: `Error cleaning up: ${error}`
    };
  }
}

// Function to clean up extracted files from public/uploads
async function cleanupPublicUploadsDirectory(ageThresholdHours = 24): Promise<CleanupResult> {
  try {
    const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(publicUploadsDir)) {
      console.log('Public uploads directory does not exist, nothing to clean');
      return { 
        deleted: 0, 
        errors: 0, 
        message: 'Public uploads directory does not exist' 
      };
    }

    const directories = fs.readdirSync(publicUploadsDir);
    let deletedCount = 0;
    let errorCount = 0;

    console.log(`Found ${directories.length} directories in public uploads directory`);

    for (const dir of directories) {
      try {
        const dirPath = path.join(publicUploadsDir, dir);
        
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
    console.error('Error cleaning up public uploads directory:', error);
    return {
      deleted: 0,
      errors: 1,
      message: `Error cleaning up: ${error}`
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get threshold from query params or use default (24 hours)
    const url = new URL(request.url);
    const ageThresholdHours = parseFloat(url.searchParams.get('ageThreshold') || '24');
    
    // Get cleanup mode
    const mode = url.searchParams.get('mode') || 'all';
    
    let results = {
      uploads: null as CleanupResult | null,
      publicUploads: null as CleanupResult | null,
      totalDeleted: 0,
      totalErrors: 0
    };

    if (mode === 'all' || mode === 'uploads') {
      results.uploads = await cleanupUploadsDirectory(ageThresholdHours);
      results.totalDeleted += results.uploads.deleted;
      results.totalErrors += results.uploads.errors;
    }

    if (mode === 'all' || mode === 'public') {
      results.publicUploads = await cleanupPublicUploadsDirectory(ageThresholdHours);
      results.totalDeleted += results.publicUploads.deleted;
      results.totalErrors += results.publicUploads.errors;
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Cleanup completed. Deleted ${results.totalDeleted} items with ${results.totalErrors} errors.`
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