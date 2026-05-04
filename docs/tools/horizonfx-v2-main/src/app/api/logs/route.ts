import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { filename, content } = await request.json();
    
    if (!filename || !content) {
      return NextResponse.json(
        { success: false, error: 'Filename and content are required' },
        { status: 400 }
      );
    }

    // Create logs directory if it doesn't exist
    const logsDir = join(process.cwd(), 'logs');
    if (!existsSync(logsDir)) {
      await mkdir(logsDir, { recursive: true });
    }

    // Write log file
    const filePath = join(logsDir, filename);
    await writeFile(filePath, content, 'utf8');

    return NextResponse.json({
      success: true,
      message: 'Log saved successfully',
      filename: filename
    });
  } catch (error) {
    console.error('Error saving log:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save log' },
      { status: 500 }
    );
  }
}