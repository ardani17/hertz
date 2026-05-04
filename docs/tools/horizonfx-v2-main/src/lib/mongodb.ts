import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/terminal';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Initialize cached connection
let cached = (global as typeof globalThis & {
  mongoose?: CachedConnection;
}).mongoose;

if (!cached) {
  cached = (global as typeof globalThis & {
    mongoose: CachedConnection;
  }).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // Use non-null assertion since we ensure cached is initialized above
  const cache = cached!;
  
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    const opts = {
      bufferCommands: false,
      // Security configurations
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      // Additional security options
      retryWrites: true,
      w: 'majority' as const, // Write concern for data safety
      readPreference: 'primary' as const, // Read from primary for consistency
    };

    cache.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      // Set up additional security configurations
      mongoose.set('sanitizeFilter', true); // Enable query sanitization
      mongoose.set('runValidators', true); // Run schema validators on updates
      return mongoose;
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (e) {
    cache.promise = null;
    throw e;
  }

  return cache.conn;
}

export default connectDB;