const ActivityLog = require('../models/ActivityLog');

// @desc    Log a single anti-cheating event during an exam attempt
// @route   POST /api/logs/:examId
// @access  Private/Student
const logEvent = async (req, res) => {
  try {
    const { eventType, description } = req.body;
    if (!eventType) return res.status(400).json({ message: 'eventType is required' });

    const log = await ActivityLog.create({
      student: req.user._id,
      exam: req.params.examId,
      eventType,
      description,
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all logs for an exam, grouped implicitly by student (admin table)
// @route   GET /api/logs/exam/:examId
// @access  Private/Admin
const getLogsByExam = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ exam: req.params.examId })
      .populate('student', 'name email')
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get one student's logs for one exam (drill-down view)
// @route   GET /api/logs/exam/:examId/student/:studentId
// @access  Private/Admin
const getLogsForStudent = async (req, res) => {
  try {
    const logs = await ActivityLog.find({
      exam: req.params.examId,
      student: req.params.studentId,
    }).sort({ timestamp: 1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Per-category violation counts for an exam — overall, and broken
//          down per student (used for the admin violation-monitoring table)
// @route   GET /api/logs/exam/:examId/summary
// @access  Private/Admin
const getViolationSummary = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ exam: req.params.examId }).populate('student', 'name email');

    const totalsByType = {};
    const perStudentMap = {};

    logs.forEach((log) => {
      totalsByType[log.eventType] = (totalsByType[log.eventType] || 0) + 1;

      const sid = log.student?._id?.toString();
      if (!sid) return;
      if (!perStudentMap[sid]) {
        perStudentMap[sid] = {
          studentId: sid,
          name: log.student.name,
          email: log.student.email,
          totalsByType: {},
          total: 0,
        };
      }
      perStudentMap[sid].totalsByType[log.eventType] = (perStudentMap[sid].totalsByType[log.eventType] || 0) + 1;
      perStudentMap[sid].total += 1;
    });

    res.json({
      totalsByType,
      totalViolations: logs.length,
      perStudent: Object.values(perStudentMap),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { logEvent, getLogsByExam, getLogsForStudent, getViolationSummary };