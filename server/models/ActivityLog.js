const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  eventType: {
    type: String,
    required: true,
    enum: [
      'TAB_SWITCH',
      'WINDOW_BLUR',
      'FULLSCREEN_EXIT',
      'COPY_ATTEMPT',
      'PASTE_ATTEMPT',
      'CUT_ATTEMPT',
      'RIGHT_CLICK',
      'KEY_SHORTCUT',
      'REFRESH_ATTEMPT',
      'DEV_TOOLS_ATTEMPT',
    ],
  },
  description: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);