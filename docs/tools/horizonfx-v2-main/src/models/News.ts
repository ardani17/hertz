import mongoose from 'mongoose';

interface INews {
  id: string;
  title: string;
  body: string;
  providerId: string;
  marketType: string;
  createdAt: Date;
  updatedAt: Date;
}

const NewsSchema = new mongoose.Schema<INews>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  providerId: {
    type: String,
    required: true
  },
  marketType: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    required: true
  },
  updatedAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: false // We'll use the timestamps from the API
});

// Create index for faster queries
NewsSchema.index({ createdAt: -1 });

const News = mongoose.models.News || mongoose.model<INews>('News', NewsSchema);

export default News;
export type { INews };