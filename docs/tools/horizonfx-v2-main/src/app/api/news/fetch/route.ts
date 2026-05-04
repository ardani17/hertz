import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import News from '@/models/News';

interface NewsItem {
  _id: string;
  id: string;
  title: string;
  body: string;
  providerId: string;
  marketType: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  data: NewsItem[];
  total: number;
  maxResults: number;
  filters: object;
}

export async function POST() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Fetch data from external API v2
    const response = await fetch('https://news.quantapi.vip/api/news?maxResults=500&sortBy=createdAt&sortOrder=desc');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiData: ApiResponse = await response.json();

    if (!apiData.success || !apiData.data) {
      throw new Error('Invalid API response');
    }

    // Silent operation - logs removed to reduce terminal noise

    // Filter data with non-empty body and valid id
    const validNews = apiData.data.filter(item => 
      item.body && 
      item.body.trim().length > 0 && 
      item.title && 
      item.title.trim().length > 0 &&
      item.id &&
      typeof item.id === 'string' &&
      item.id.trim().length > 0
    );

    if (validNews.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No valid news items found' 
      });
    }

    // Select up to 50 items (increased from 15 to preserve more data)
    const shuffled = validNews.sort(() => 0.5 - Math.random());
    const selectedNews = shuffled.slice(0, Math.min(50, shuffled.length));

    // Check for existing news to avoid duplicates
    const validIds = selectedNews
      .map(item => {
        // Ensure we only work with valid string IDs
        if (typeof item.id === 'string' && item.id.trim().length > 0) {
          return item.id.trim();
        }
        // Skip invalid IDs
        return null;
      })
      .filter(id => id !== null) as string[];
    
    if (validIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No valid IDs found in news items' 
      });
    }
    
    // Use a more explicit query approach to avoid CastError
    let existingIds: string[] = [];
    try {
      // Ensure validIds is a proper array of strings
      const cleanIds = validIds.filter(id => typeof id === 'string' && id.length > 0);
      
      if (cleanIds.length > 0) {
        // Use a simpler approach to avoid CastError
        const existingDocs: string[] = [];
        for (const cleanId of cleanIds) {
          const doc = await News.findOne({ id: cleanId }, { id: 1, _id: 0 }).lean() as { id: string } | null;
          if (doc && doc.id) {
            existingDocs.push(doc.id);
          }
        }
        existingIds = existingDocs;
      }
    } catch {
      // Silent operation - logs removed to reduce terminal noise
      // If query fails, assume no existing IDs to proceed with insertion
      existingIds = [];
    }
    
    const existingIdSet = new Set(existingIds);
    const newNews = selectedNews.filter(item => {
      // Only process items with valid string IDs
      if (typeof item.id === 'string' && item.id.trim().length > 0) {
        return !existingIdSet.has(item.id.trim());
      }
      // Skip items with invalid IDs
      return false;
    });

    if (newNews.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No new news items to save (all duplicates)',
        saved: 0
      });
    }

    // Prepare data for insertion
    const newsToInsert = newNews.map(item => ({
      id: item.id.trim(), // We already validated this is a valid string
      title: item.title,
      body: item.body,
      providerId: item.providerId,
      marketType: item.marketType,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }));



    // Insert new news items using upsert to avoid duplicates
    const insertPromises = newsToInsert.map(newsItem => 
      News.updateOne(
        { id: newsItem.id },
        { $setOnInsert: newsItem },
        { upsert: true }
      )
    );
    
    const results = await Promise.all(insertPromises);
    const insertedCount = results.filter(result => result.upsertedCount > 0).length;

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${insertedCount} news items`,
      saved: insertedCount,
      total: validNews.length,
      duplicates: selectedNews.length - newNews.length
    });

  } catch (error) {
    // Silent operation - logs removed to reduce terminal noise
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}