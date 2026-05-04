import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
// Simple validation function for admin registration
function validateInput(data: { username: string; email: string; password: string }) {
  const errors: string[] = [];
  
  if (!data.username || data.username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Valid email is required');
  }
  
  if (!data.password || data.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();

    // Validate input
    const validation = validateInput({ username, email, password });

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if any admin already exists (one-time registration only)
    const existingAdminCount = await Admin.countDocuments();
    if (existingAdminCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Admin registration is no longer available' },
        { status: 403 }
      );
    }

    // Check if username or email already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ username }, { email }]
    });

    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'Username or email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin
    const admin = new Admin({
      username,
      email,
      password: hashedPassword
    });

    await admin.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Admin registered successfully',
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET method to check if registration is available
export async function GET() {
  try {
    await connectDB();
    
    const adminCount = await Admin.countDocuments();
    
    return NextResponse.json({
      success: true,
      registrationAvailable: adminCount === 0,
      adminExists: adminCount > 0
    });
  } catch (error) {
    console.error('Check registration availability error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}