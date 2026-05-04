import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Types } from 'mongoose';

// Helper function to validate admin session
async function validateAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return null;
  }
  return session;
}

// PUT /api/admin/user-management/[id]/credits - Update user credits
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const session = await validateAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { credits } = await request.json();

    // Validate input
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (credits === undefined || credits === null) {
      return NextResponse.json(
        { error: 'Credits value is required' },
        { status: 400 }
      );
    }

    if (typeof credits !== 'number' || credits < 0) {
      return NextResponse.json(
        { error: 'Credits must be a non-negative number' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user credits
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { credits },
      { new: true, select: 'username email credits' }
    );

    return NextResponse.json({
      success: true,
      message: 'User credits updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user credits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}