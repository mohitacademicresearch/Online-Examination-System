const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    questionType: { type: String, enum: ['mcq', 'short', 'long'], default: 'mcq' },
    questionText: { type: String, required: true },
    // Options for MCQ questions
    options: { type: [String], default: [] },
    correctOption: { type: Number },// Correct option for MCQ
    maxMarks: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Validate MCQ question fields
questionSchema.pre('validate', function (next) {
  if (this.questionType === 'mcq') {
    if (!this.options || this.options.length < 2) {
      return next(new Error('MCQ questions need at least 2 options'));
    }
    if (this.correctOption === undefined || this.correctOption === null || this.correctOption < 0 || this.correctOption >= this.options.length) {
      return next(new Error('correctOption must be a valid index into options[]'));
    }
  }
  next();
});

module.exports = mongoose.model('Question', questionSchema);