import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const logsDir = join(process.cwd(), 'logs');
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000); // 24 hours in milliseconds
    
    let deletedCount = 0;
    let totalSize = 0;

    try {
      // Read all files in logs directory
      const files = await readdir(logsDir);
      
      for (const file of files) {
        const filePath = join(logsDir, file);
        
        try {
          const stats = await stat(filePath);
          
          // Check if file is older than 1 day
          if (stats.mtime.getTime() < oneDayAgo) {
            totalSize += stats.size;
            await unlink(filePath);
            deletedCount++;
          }
        } catch (fileError) {
          console.error(`Error processing file ${file}:`, fileError);
          // Continue with other files even if one fails
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${deletedCount} log files`,
        deletedCount,
        totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`
      });

    } catch (dirError) {
      console.error('Error reading logs directory:', dirError);
      return NextResponse.json({
        success: false,
        error: 'Logs directory not found or inaccessible'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Error deleting logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete logs' },
      { status: 500 }
    );
  }
}