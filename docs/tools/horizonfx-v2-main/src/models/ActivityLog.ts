import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  action: string;
  description: string;
  userId?: string;
  username?: string;
  ip: string;
  userAgent?: string;
  status: 'success' | 'warning' | 'error';
  category: 'auth' | 'admin' | 'system' | 'security' | 'data';
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  action: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  userId: {
    type: String,
    trim: true
  },
  username: {
    type: String,
    trim: true,
    maxlength: 50
  },
  ip: {
    type: String,
    required: true,
    trim: true,
    maxlength: 45 // IPv6 max length
  },
  userAgent: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['success', 'warning', 'error'],
    required: true,
    default: 'success'
  },
  category: {
    type: String,
    enum: ['auth', 'admin', 'system', 'security', 'data'],
    required: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // We use our own timestamp field
});

// Indexes for better query performance
ActivityLogSchema.index({ timestamp: -1 });
ActivityLogSchema.index({ category: 1, timestamp: -1 });
ActivityLogSchema.index({ status: 1, timestamp: -1 });
ActivityLogSchema.index({ userId: 1, timestamp: -1 });
ActivityLogSchema.index({ ip: 1, timestamp: -1 });

// TTL index to automatically delete old logs after 90 days
ActivityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const ActivityLog = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);

export default ActivityLog;