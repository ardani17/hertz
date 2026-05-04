import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import News from '@/models/News';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { action, ids } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    // Only validate ids for actions that require them
    if ((action === 'delete') && (!ids || !Array.isArray(ids) || ids.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'News IDs are required for delete action' },
        { status: 400 }
      );
    }

    let result;
    let message;

    switch (action) {
      case 'delete':
        // Delete items one by one using findByIdAndDelete (which works)
        let deletedCount = 0;
        for (const id of ids) {
          const deleted = await News.findByIdAndDelete(id);
          if (deleted) deletedCount++;
        }
        result = { deletedCount };
        message = `${deletedCount} news items deleted successfully`;
        break;

      case 'deleteOld':
        // Delete news older than specified days
        const { days = 30 } = body;
        const now = new Date();
        const cutoffTime = now.getTime() - (days * 24 * 60 * 60 * 1000);
        const cutoffDate = new Date(cutoffTime);
        
        // Query for documents where createdAt is less than cutoff date
        // Use raw MongoDB query to handle $date format properly
        result = await News.collection.deleteMany({ 
          createdAt: { 
            $lt: cutoffDate 
          }
        });
        message = `${result.deletedCount} old news items deleted successfully`;
        break;

      case 'deleteAll':
        result = await News.deleteMany({});
        message = `${result.deletedCount} news items deleted successfully`;
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    const affectedCount = result && typeof result === 'object' && 'deletedCount' in result 
      ? result.deletedCount 
      : 0;

    return NextResponse.json({
      success: true,
      message,
      data: {
        affected: affectedCount
      }
    });

  } catch (error) {
    console.error('Admin news bulk operation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}