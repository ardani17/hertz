import mongoose from 'mongoose';

interface IToolUsage {
  toolName: string;
  toolType: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  usageData?: {
    inputParams?: Record<string, unknown>;
    calculationTime?: number;
    success?: boolean;
  };
  createdAt: Date;
}

const ToolUsageSchema = new mongoose.Schema<IToolUsage>({
  toolName: {
    type: String,
    required: true,
    index: true
  },
  toolType: {
    type: String,
    required: true,
    enum: ['calculator', 'analysis', 'chart', 'data'],
    default: 'calculator'
  },
  userAgent: {
    type: String,
    required: false
  },
  ipAddress: {
    type: String,
    required: false
  },
  sessionId: {
    type: String,
    required: false
  },
  usageData: {
    inputParams: {
      type: mongoose.Schema.Types.Mixed,
      required: false
    },
    calculationTime: {
      type: Number,
      required: false
    },
    success: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: false
});

// Create indexes for faster queries
ToolUsageSchema.index({ createdAt: -1 });
ToolUsageSchema.index({ toolName: 1, createdAt: -1 });
ToolUsageSchema.index({ toolType: 1, createdAt: -1 });

const ToolUsage = mongoose.models.ToolUsage || mongoose.model<IToolUsage>('ToolUsage', ToolUsageSchema);

export default ToolUsage;
export type { IToolUsage };