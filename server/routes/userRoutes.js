const express = require('express');
const router = express.Router();
const {
  registerStudent,
  loginUser,
  getProfile,
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  updateProfile,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/register', registerStudent);
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

router.get('/students', protect, adminOnly, getAllStudents);
router.post('/students', protect, adminOnly, createStudent);
router.put('/students/:id', protect, adminOnly, updateStudent);
router.delete('/students/:id', protect, adminOnly, deleteStudent);

module.exports = router;