const Submission = require('../models/Submission');
const Question = require('../models/Question');
const Exam = require('../models/Exam');

// Submit exam and calculate marks
const submitExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { answers, violationCount } = req.body; // [{ question, selectedOption?, textAnswer? }]

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const existing = await Submission.findOne({ student: req.user._id, exam: examId });
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted this exam' });
    }

    const questions = await Question.find({ exam: examId });
    const qMap = {};
    questions.forEach((q) => {
      qMap[q._id.toString()] = q;
    });

    let score = 0;
    let hasPending = false;
    const answeredIds = new Set();

    const processedAnswers = (answers || [])
      .filter((a) => qMap[a.question])
      .map((a) => {
        const q = qMap[a.question];
        answeredIds.add(q._id.toString());

        if (q.questionType === 'mcq') {
          const marksAwarded = a.selectedOption === q.correctOption ? q.maxMarks : 0;
          score += marksAwarded;
          return { question: q._id, selectedOption: a.selectedOption, marksAwarded };
        }
         // Save subjective answer for manual grading
        hasPending = true;
        return { question: q._id, textAnswer: a.textAnswer || '', marksAwarded: null };
      });

   // Add unanswered questions to the submission
    questions.forEach((q) => {
      if (!answeredIds.has(q._id.toString())) {
        if (q.questionType !== 'mcq') hasPending = true;
        processedAnswers.push({
          question: q._id,
          marksAwarded: q.questionType === 'mcq' ? 0 : null,
        });
      }
    });

    const totalMarks = questions.reduce((sum, q) => sum + q.maxMarks, 0);

    const submission = await Submission.create({
      student: req.user._id,
      exam: examId,
      answers: processedAnswers,
      score,
      totalQuestions: questions.length,
      totalMarks,
      status: hasPending ? 'pending_review' : 'graded',
      violationCount: Number(violationCount) || 0,
    });

    const response = {
      message: 'Exam submitted',
      status: submission.status,
      violationCount: submission.violationCount,
    };

    if (submission.status === 'graded') {
      const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
      response.score = score;
      response.totalMarks = totalMarks;
      response.passMark = exam.passMark;
      response.passed = percentage >= exam.passMark;
    }

    res.status(201).json(response);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already submitted this exam' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all submissions for an exam
const getSubmissionsByExam = async (req, res) => {
  try {
    const submissions = await Submission.find({ exam: req.params.examId })
      .populate('student', 'name email')
      .sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get submissions for logged-in student
const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user._id }).populate('exam', 'title passMark');
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get student result for one exam
const getMySubmissionForExam = async (req, res) => {
  try {
    const submission = await Submission.findOne({
      student: req.user._id,
      exam: req.params.examId,
    }).populate('exam', 'title passMark');

    if (!submission) return res.status(404).json({ message: 'No submission found for this exam' });

    const base = {
      examTitle: submission.exam?.title,
      status: submission.status,
      violationCount: submission.violationCount,
      submittedAt: submission.submittedAt,
    };

    if (submission.status === 'graded') {
      const percentage = submission.totalMarks > 0 ? (submission.score / submission.totalMarks) * 100 : 0;
      base.score = submission.score;
      base.totalMarks = submission.totalMarks;
      base.passMark = submission.exam?.passMark ?? 40;
      base.passed = percentage >= base.passMark;
    }

    res.json(base);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get submissions waiting for grading
const getPendingSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ status: 'pending_review' })
      .populate('student', 'name email')
      .populate('exam', 'title')
      .sort({ submittedAt: 1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get submission details for grading
const getSubmissionDetail = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('student', 'name email')
      .populate('exam', 'title passMark')
      .populate('answers.question', 'questionText questionType options correctOption maxMarks');

    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Save marks given by admin
const gradeSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    const { marks } = req.body; // [{ questionId, marksAwarded }]
    const marksMap = {};
    (marks || []).forEach((m) => {
      marksMap[m.questionId] = m.marksAwarded;
    });

    submission.answers.forEach((a) => {
      const qId = a.question.toString();
      if (marksMap[qId] !== undefined && marksMap[qId] !== null && marksMap[qId] !== '') {
        a.marksAwarded = Number(marksMap[qId]);
      }
    });

    const stillPending = submission.answers.some((a) => a.marksAwarded === null || a.marksAwarded === undefined);
    submission.score = submission.answers.reduce((sum, a) => sum + (a.marksAwarded || 0), 0);
    submission.status = stillPending ? 'pending_review' : 'graded';

    await submission.save();
    res.json({ message: 'Grades saved', status: submission.status, score: submission.score });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  submitExam,
  getSubmissionsByExam,
  getMySubmissions,
  getMySubmissionForExam,
  getPendingSubmissions,
  getSubmissionDetail,
  gradeSubmission,
};