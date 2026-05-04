import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ToolUsage from '@/models/ToolUsage';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { toolName, toolType, usageData } = body;

    // Validate required fields
    if (!toolName) {
      return NextResponse.json(
        { success: false, error: 'Tool name is required' },
        { status: 400 }
      );
    }

    // Get client information
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : 
                     request.headers.get('x-real-ip') || 
                     undefined;

    // Create usage record
    const toolUsage = new ToolUsage({
      toolName,
      toolType: toolType || 'calculator',
      userAgent,
      ipAddress,
      usageData,
      createdAt: new Date()
    });

    await toolUsage.save();

    return NextResponse.json({
      success: true,
      message: 'Tool usage recorded successfully',
      data: {
        id: toolUsage._id,
        toolName: toolUsage.toolName,
        createdAt: toolUsage.createdAt
      }
    });

  } catch (error) {
    console.error('Tool usage recording error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record tool usage' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const toolName = searchParams.get('toolName');
    const toolType = searchParams.get('toolType');
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query
    const query: Record<string, unknown> = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (toolName) {
      query.toolName = toolName;
    }

    if (toolType) {
      query.toolType = toolType;
    }

    // Get usage data
    const usageData = await ToolUsage.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('toolName toolType createdAt usageData');

    // Get total count
    const totalCount = await ToolUsage.countDocuments(query);

    // Simple statistics - count by tool name
    const toolCounts = await ToolUsage.aggregate([
      { $match: query },
      { $group: { _id: '$toolName', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        usage: usageData,
        statistics: toolCounts,
        period: days,
        total: totalCount
      }
    });

  } catch (error) {
    console.error('Tool usage fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tool usage data' },
      { status: 500 }
    );
  }
}