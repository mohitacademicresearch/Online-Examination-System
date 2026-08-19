const ActivityLog = require('../models/ActivityLog');

// Save anti-cheating violation log
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

// Get all violation logs for an exam
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

// Get violation logs for one student
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

// Get violation summary and counts
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