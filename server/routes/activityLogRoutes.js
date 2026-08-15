const express = require('express');
const router = express.Router();
const {
  logEvent,
  getLogsByExam,
  getLogsForStudent,
  getViolationSummary,
} = require('../controllers/activityLogController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/:examId', protect, logEvent);
router.get('/exam/:examId/summary', protect, adminOnly, getViolationSummary);
router.get('/exam/:examId/student/:studentId', protect, adminOnly, getLogsForStudent);
router.get('/exam/:examId', protect, adminOnly, getLogsByExam);

module.exports = router;