import mongoose from 'mongoose';

interface IPageView {
  path: string;
  userAgent?: string;
  ip?: string;
  referrer?: string;
  sessionId?: string;
  responseTime?: number;
  statusCode?: number;
  timestamp: Date;
}

const PageViewSchema = new mongoose.Schema<IPageView>({
  path: {
    type: String,
    required: true,
    index: true
  },
  userAgent: {
    type: String,
    default: null
  },
  ip: {
    type: String,
    default: null
  },
  referrer: {
    type: String,
    default: null
  },
  sessionId: {
    type: String,
    default: null
  },
  responseTime: {
    type: Number,
    default: null
  },
  statusCode: {
    type: Number,
    default: 200
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
PageViewSchema.index({ timestamp: -1 });
PageViewSchema.index({ path: 1, timestamp: -1 });
PageViewSchema.index({ sessionId: 1, timestamp: -1 });

const PageView = mongoose.models.PageView || mongoose.model<IPageView>('PageView', PageViewSchema);

export default PageView;
export type { IPageView };