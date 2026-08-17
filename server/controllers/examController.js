const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Submission = require('../models/Submission');

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private/Admin
const createExam = async (req, res) => {
  try {
    const { title, description, duration, passMark, maxViolations, startDate, endDate } = req.body;

    if (!title || !duration || !startDate || !endDate) {
      return res.status(400).json({ message: 'Title, duration, startDate and endDate are required' });
    }

    const exam = await Exam.create({
      title,
      description,
      duration,
      passMark: passMark !== undefined ? passMark : 40,
      maxViolations: maxViolations !== undefined ? maxViolations : 5,
      startDate,
      endDate,
      createdBy: req.user._id,
    });

    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update an exam's details
// @route   PUT /api/exams/:id
// @access  Private/Admin
const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const fields = ['title', 'description', 'duration', 'passMark', 'maxViolations', 'startDate', 'endDate', 'isPublished'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) exam[f] = req.body[f];
    });

    const updated = await exam.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete an exam (and its questions)
// @route   DELETE /api/exams/:id
// @access  Private/Admin
const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    await Question.deleteMany({ exam: exam._id });
    await exam.deleteOne();

    res.json({ message: 'Exam and its questions deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    List all exams (admin view)
// @route   GET /api/exams
// @access  Private/Admin
const getAllExamsAdmin = async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    List exams a student is currently allowed to see, flagged with
//          whether they've already submitted each one
// @route   GET /api/exams/available
// @access  Private/Student
const getAvailableExams = async (req, res) => {
  try {
    const now = new Date();
    const exams = await Exam.find({
      isPublished: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).select('title description duration passMark startDate endDate');

    const submittedExamIds = await Submission.find({ student: req.user._id })
      .distinct('exam');
    const submittedSet = new Set(submittedExamIds.map((id) => id.toString()));

    const result = exams.map((exam) => ({
      ...exam.toObject(),
      submitted: submittedSet.has(exam._id.toString()),
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get one exam with its questions, for attempting — correct answers stripped
// @route   GET /api/exams/:id/attempt
// @access  Private/Student
const getExamForAttempt = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam || !exam.isPublished) {
      return res.status(404).json({ message: 'Exam not available' });
    }

    const now = new Date();
    if (now < exam.startDate || now > exam.endDate) {
      return res.status(403).json({ message: 'This exam is not currently open' });
    }

    const alreadySubmitted = await Submission.findOne({ student: req.user._id, exam: exam._id });
    if (alreadySubmitted) {
      return res.status(403).json({ message: 'You have already submitted this exam' });
    }

    const questions = await Question.find({ exam: exam._id }).select('-correctOption');

    res.json({
      _id: exam._id,
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      passMark: exam.passMark,
      maxViolations: exam.maxViolations,
      questions,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createExam,
  updateExam,
  deleteExam,
  getAllExamsAdmin,
  getAvailableExams,
  getExamForAttempt,
};