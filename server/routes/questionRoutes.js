const express = require('express');
const router = express.Router();
const {
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionsByExam,
} = require('../controllers/questionController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/:examId', protect, adminOnly, addQuestion);
router.get('/:examId', protect, adminOnly, getQuestionsByExam);
router.put('/:id', protect, adminOnly, updateQuestion);
router.delete('/:id', protect, adminOnly, deleteQuestion);

module.exports = router;