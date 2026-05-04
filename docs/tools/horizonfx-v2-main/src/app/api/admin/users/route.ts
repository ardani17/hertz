import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth/next'
import { Types } from 'mongoose'
import connectDB from '@/lib/mongodb'
import { authOptions } from '@/lib/auth'
import Admin from '@/models/Admin'

// Helper function to validate admin session
async function validateAdminSession() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return null
  }
  return session
}

// GET - Fetch all admins
export async function GET() {
  try {
    // Validate admin session
    const session = await validateAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const admins = await Admin.find({}, { password: 0 }).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: admins,
      total: admins.length
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    );
  }
}

// POST - Create new admin
export async function POST(request: NextRequest) {
  try {
    // Validate admin session
    const session = await validateAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { username, email, password } = await request.json();

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { username }]
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin with this email or username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new admin
    const newAdmin = new Admin({
      username,
      email,
      password: hashedPassword
    });

    await newAdmin.save();

    // Return admin without password
    const adminResponse = {
      _id: newAdmin._id,
      username: newAdmin.username,
      email: newAdmin.email,
      createdAt: newAdmin.createdAt,
      updatedAt: newAdmin.updatedAt
    };

    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
      data: adminResponse
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    );
  }
}

// PUT - Update admin (password only)
export async function PUT(request: NextRequest) {
  try {
    // Validate admin session
    const session = await validateAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, password } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid admin ID format' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if admin exists
    const existingAdmin = await Admin.findById(id);
    if (!existingAdmin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update only the password
    const updatedAdmin = await Admin.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true, select: '-password' }
    );

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      data: updatedAdmin
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json(
      { error: 'Failed to update admin' },
      { status: 500 }
    );
  }
}

// DELETE - Delete admin
export async function DELETE(request: NextRequest) {
  try {
    // Validate admin session
    const session = await validateAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if admin exists
    const existingAdmin = await Admin.findById(id);
    if (!existingAdmin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Prevent deleting the last admin
    const adminCount = await Admin.countDocuments();
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last admin account' },
        { status: 400 }
      );
    }

    // Prevent admin from deleting themselves
    if (session.user && session.user.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete admin
    await Admin.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch {
    // Silent operation - logs removed to reduce terminal noise
    return NextResponse.json(
      { error: 'Failed to delete admin' },
      { status: 500 }
    );
  }
}