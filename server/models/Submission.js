const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    answers: [
      {
        question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        selectedOption: { type: Number }, // mcq answers
        textAnswer: { type: String }, // short/long answer text
        // null = not graded yet. MCQs are auto-graded at submit time;
        // short/long answers stay null until an admin grades them.
        marksAwarded: { type: Number, default: null },
      },
    ],
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    status: { type: String, enum: ['pending_review', 'graded'], default: 'graded' },
    violationCount: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// A student can only submit a given exam once
submissionSchema.index({ student: 1, exam: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);