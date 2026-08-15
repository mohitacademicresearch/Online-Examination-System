const express = require('express');
const router = express.Router();
const {
  createExam,
  updateExam,
  deleteExam,
  getAllExamsAdmin,
  getAvailableExams,
  getExamForAttempt,
} = require('../controllers/examController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Student-facing
router.get('/available', protect, getAvailableExams);
router.get('/:id/attempt', protect, getExamForAttempt);

// Admin-facing
router.post('/', protect, adminOnly, createExam);
router.get('/', protect, adminOnly, getAllExamsAdmin);
router.put('/:id', protect, adminOnly, updateExam);
router.delete('/:id', protect, adminOnly, deleteExam);

module.exports = router;