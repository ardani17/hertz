import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
  destinationUrl: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  imageName: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
AnnouncementSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create index for better query performance
AnnouncementSchema.index({ isActive: 1, createdAt: -1 });

const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);

export default Announcement;