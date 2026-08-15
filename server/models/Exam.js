const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    duration: { type: Number, required: true }, // in minutes
    passMark: { type: Number, default: 40 }, // percentage required to pass
    maxViolations: { type: Number, default: 5 }, // 0 = no auto-submit limit
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exam', examSchema);