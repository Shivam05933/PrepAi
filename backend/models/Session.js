import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true
    },
    currentDifficulty: {
      type: Number,
      default: 1,
      min: [1, 'Difficulty cannot be less than 1'],
      max: [10, 'Difficulty cannot be greater than 10']
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'completed'],
        message: 'Status must be active or completed'
      },
      default: 'active'
    },
    attemptsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalScore: {
      type: Number,
      default: 0,
      min: 0
    },
    scoreHistory: {
      type: [Number],
      default: []
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const Session = mongoose.model('Session', sessionSchema);

export default Session;
