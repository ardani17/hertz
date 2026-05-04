import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper function to validate admin session
async function validateAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return null;
  }
  return session;
}

// GET /api/admin/user-management/export - Export all user emails to CSV
export async function GET() {
  try {
    // Verify admin authentication
    const session = await validateAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get all users with only email field
    const users = await User.find({}, { email: 1, username: 1, firstName: 1, lastName: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean();

    // Create CSV content
    const csvHeader = 'Email,Username,First Name,Last Name,Created At\n';
    const csvRows = users.map(user => {
      const email = user.email || '';
      const username = user.username || '';
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const createdAt = user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '';
      
      // Escape commas and quotes in CSV
      const escapeCSV = (field: string) => {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };
      
      return `${escapeCSV(email)},${escapeCSV(username)},${escapeCSV(firstName)},${escapeCSV(lastName)},${escapeCSV(createdAt)}`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    // Create response with CSV file
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-cache'
      }
    });

    return response;
  } catch (error) {
    console.error('Error exporting users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}