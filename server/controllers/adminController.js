const User = require('../models/User');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const ActivityLog = require('../models/ActivityLog');

// @desc    Summary counts + recent activity for the admin dashboard overview
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const [totalStudents, totalExams, totalQuestions, totalViolations, examsConductedIds, pendingGrading] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Exam.countDocuments(),
      Question.countDocuments(),
      ActivityLog.countDocuments(),
      Submission.distinct('exam'),
      Submission.countDocuments({ status: 'pending_review' }),
    ]);

    const recentlyCompleted = await Submission.find()
      .populate('student', 'name')
      .populate('exam', 'title passMark')
      .sort({ submittedAt: -1 })
      .limit(5);

    const recentlyCompletedExams = recentlyCompleted.map((s) => {
      const percentage = s.totalMarks > 0 ? (s.score / s.totalMarks) * 100 : 0;
      return {
        student: s.student?.name,
        exam: s.exam?.title,
        score: s.score,
        totalMarks: s.totalMarks,
        status: s.status,
        passed: s.status === 'graded' ? percentage >= (s.exam?.passMark ?? 40) : null,
        submittedAt: s.submittedAt,
      };
    });

    res.json({
      totalStudents,
      totalExams,
      totalQuestions,
      examsConducted: examsConductedIds.length,
      totalViolations,
      pendingGrading,
      recentlyCompletedExams,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getDashboardStats };