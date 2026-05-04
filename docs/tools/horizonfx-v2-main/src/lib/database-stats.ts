import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';

export interface DatabaseStats {
  collections: number;
  totalDocuments: number;
  databaseSize: string;
  indexes: number;
}

export async function getDatabaseStats(): Promise<DatabaseStats> {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    // Get list of collections
    const collections = await db.listCollections().toArray();
    const collectionCount = collections.length;

    // Get database stats
    const dbStats = await db.stats();
    
    // Calculate total documents across all collections
    let totalDocuments = 0;
    for (const collection of collections) {
      try {
        const collectionStats = await db.collection(collection.name).countDocuments();
        totalDocuments += collectionStats;
      } catch (error) {
        console.warn(`Failed to count documents in collection ${collection.name}:`, error);
      }
    }

    // Format database size
    const sizeInBytes = dbStats.dataSize || 0;
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    const databaseSize = `${sizeInMB} MB`;

    // Count total indexes
    let totalIndexes = 0;
    for (const collection of collections) {
      try {
        const indexes = await db.collection(collection.name).listIndexes().toArray();
        totalIndexes += indexes.length;
      } catch (error) {
        console.warn(`Failed to count indexes in collection ${collection.name}:`, error);
      }
    }

    return {
      collections: collectionCount,
      totalDocuments,
      databaseSize,
      indexes: totalIndexes
    };
  } catch (error) {
    console.error('Failed to get database stats:', error);
    // Return fallback data
    return {
      collections: 0,
      totalDocuments: 0,
      databaseSize: '0 MB',
      indexes: 0
    };
  }
}

export async function getCollectionsList(): Promise<Array<{ name: string; count: number; size: string }>> {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    const collections = await db.listCollections().toArray();
    const collectionDetails = [];

    for (const collection of collections) {
      try {
        const count = await db.collection(collection.name).countDocuments();
        // Use db.command to get collection stats
        const stats = await db.command({ collStats: collection.name });
        const sizeInMB = ((stats.size || 0) / (1024 * 1024)).toFixed(2);
        
        collectionDetails.push({
          name: collection.name,
          count,
          size: `${sizeInMB} MB`
        });
      } catch (error) {
        console.warn(`Failed to get stats for collection ${collection.name}:`, error);
        collectionDetails.push({
          name: collection.name,
          count: 0,
          size: '0 MB'
        });
      }
    }

    return collectionDetails;
  } catch (error) {
    console.error('Failed to get collections list:', error);
    return [];
  }
}