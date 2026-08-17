const User = require('../models/User');
const Submission = require('../models/Submission');
const ActivityLog = require('../models/ActivityLog');
const generateToken = require('../utils/generateToken');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (email) => EMAIL_REGEX.test(String(email || '').trim());

// @desc    Register a new student
// @route   POST /api/users/register
// @access  Public
const registerStudent = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password, role: 'student' });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login (shared by student and admin login forms)
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password, expectedRole } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({ message: `This account is not registered as ${expectedRole}` });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get logged-in user's profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  res.json(req.user);
};

// @desc    List all registered students
// @route   GET /api/users/students
// @access  Private/Admin
const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Admin creates a student account directly
// @route   POST /api/users/students
// @access  Private/Admin
const createStudent = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }
    const student = await User.create({ name, email, password, role: 'student' });
    res.status(201).json({ _id: student._id, name: student.name, email: student.email, role: student.role });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Admin updates a student's name/email (and optionally password)
// @route   PUT /api/users/students/:id
// @access  Private/Admin
const updateStudent = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const { name, email, password } = req.body;

    if (email !== undefined) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
      }
      const clash = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: student._id } });
      if (clash) {
        return res.status(400).json({ message: 'Another account already uses this email' });
      }
      student.email = email;
    }
    if (name !== undefined) student.name = name;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      student.password = password; // pre-save hook re-hashes it
    }

    const updated = await student.save();
    res.json({ _id: updated._id, name: updated.name, email: updated.email, role: updated.role });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Admin deletes a student account, along with their submissions
//          and activity logs (so no orphaned data shows up elsewhere —
//          e.g. Results, Recently Completed Exams, Activity Logs)
// @route   DELETE /api/users/students/:id
// @access  Private/Admin
const deleteStudent = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    await Submission.deleteMany({ student: student._id });
    await ActivityLog.deleteMany({ student: student._id });
    await student.deleteOne();

    res.json({ message: 'Student and their related exam data were deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Logged-in user updates their own name and/or password
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { name, password } = req.body;
    if (name !== undefined) user.name = name;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      user.password = password;
    }
    const updated = await user.save();
    res.json({ _id: updated._id, name: updated.name, email: updated.email, role: updated.role });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  registerStudent,
  loginUser,
  getProfile,
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  updateProfile,
};