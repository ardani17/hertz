import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import News from '@/models/News';

// Security: Sanitize search input to prevent ReDoS attacks
function sanitizeSearchInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove dangerous regex patterns but allow basic search
  return input
    .replace(/[.*+?^${}()|[\]\\]/g, '') // Remove regex special chars
    .trim()
    .slice(0, 100); // Limit to 100 characters
}

// Security: Validate pagination parameters
function validatePaginationParams(page: string | null, limit: string | null) {
  const parsedPage = parseInt(page || '1');
  const parsedLimit = parseInt(limit || '10');
  
  return {
    page: Math.max(1, Math.min(parsedPage, 1000)), // Max 1000 pages
    limit: Math.max(1, Math.min(parsedLimit, 100)) // Max 100 items per page
  };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const rawSearch = searchParams.get('search') || '';
    const { page, limit } = validatePaginationParams(
      searchParams.get('page'),
      searchParams.get('limit')
    );
    const skip = (page - 1) * limit;

    // Security: Sanitize search input
    const search = sanitizeSearchInput(rawSearch);

    // Build search query with sanitized input - only search in title field
    let searchQuery = {};
    if (search) {
      try {
        // Use RegExp constructor for proper MongoDB regex query
        searchQuery = {
          title: new RegExp(search, 'i')
        };
      } catch (error) {
        console.error('Error building search query:', error);
        // Fallback to simple text match using $regex string format
        searchQuery = {
          title: { $regex: search.toString(), $options: 'i' }
        };
      }
    }

    // Get total count for pagination
    const total = await News.countDocuments(searchQuery);

    // Get news items with pagination
    const news = await News.find(searchQuery)
      .sort({ createdAt: -1 }) // Latest first
      .skip(skip)
      .limit(limit)
      .lean();

    const response = NextResponse.json({
      success: true,
      data: news,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

    // Security: Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;

  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}