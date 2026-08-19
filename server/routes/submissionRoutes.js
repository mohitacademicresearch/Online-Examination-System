const express = require('express');
const router = express.Router();
const {
  submitExam,
  getSubmissionsByExam,
  getMySubmissions,
  getMySubmissionForExam,
  getPendingSubmissions,
  getSubmissionDetail,
  gradeSubmission,
} = require('../controllers/submissionController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/:examId', protect, submitExam);

router.get('/mine', protect, getMySubmissions);
router.get('/mine/:examId', protect, getMySubmissionForExam);
// Get submissions waiting for grading
router.get('/pending', protect, adminOnly, getPendingSubmissions);
router.get('/exam/:examId', protect, adminOnly, getSubmissionsByExam);
router.get('/:id', protect, adminOnly, getSubmissionDetail);
router.put('/:id/grade', protect, adminOnly, gradeSubmission);

module.exports = router;