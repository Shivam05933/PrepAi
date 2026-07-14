import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'Session ID is required']
    },
    userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
},
    question: {
      type: String,
      required: [true, 'Question content is required']
    },
    userAnswer: {
      type: String,
      required: [true, 'User answer is required']
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [0, 'Score cannot be less than 0'],
      max: [10, 'Score cannot be greater than 10']
    },
    feedback: {
      type: String,
      required: [true, 'Feedback is required']
    },
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer explanation is required']
    },
    difficulty: {
      type: Number,
      required: [true, 'Difficulty level at the time of attempt is required'],
      min: 1,
      max: 10
    }
  },
  {
    timestamps: true
  }
);

const Attempt = mongoose.model('Attempt', attemptSchema);

export default Attempt;
