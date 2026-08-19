const Question = require('../models/Question');
const Exam = require('../models/Exam');

const validateMcqFields = (options, correctOption) => {
  if (!Array.isArray(options) || options.length < 2) {
    return 'MCQ questions need at least 2 options';
  }
  if (correctOption === undefined || correctOption === null || correctOption < 0 || correctOption >= options.length) {
    return 'correctOption index is out of range for options[]';
  }
  return null;
};

// Add a question to an exam
const addQuestion = async (req, res) => {
  try {
    const { questionType, questionText, options, correctOption, maxMarks } = req.body;
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    if (!questionText) {
      return res.status(400).json({ message: 'questionText is required' });
    }

    const type = questionType || 'mcq';
    if (type === 'mcq') {
      const err = validateMcqFields(options, correctOption);
      if (err) return res.status(400).json({ message: err });
    }

    const question = await Question.create({
      exam: exam._id,
      questionType: type,
      questionText,
      options: type === 'mcq' ? options : [],
      correctOption: type === 'mcq' ? correctOption : undefined,
      maxMarks: maxMarks !== undefined ? Number(maxMarks) : 1,
    });

    exam.questions.push(question._id);
    await exam.save();

    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a question
const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const { questionType, questionText, options, correctOption, maxMarks } = req.body;
    const type = questionType !== undefined ? questionType : question.questionType;

    if (type === 'mcq') {
      const finalOptions = options !== undefined ? options : question.options;
      const finalCorrect = correctOption !== undefined ? correctOption : question.correctOption;
      const err = validateMcqFields(finalOptions, finalCorrect);
      if (err) return res.status(400).json({ message: err });
      question.options = finalOptions;
      question.correctOption = finalCorrect;
    } else if (questionType !== undefined) {
      // switching to a subjective type — clear mcq-only fields
      question.options = [];
      question.correctOption = undefined;
    }

    question.questionType = type;
    if (questionText !== undefined) question.questionText = questionText;
    if (maxMarks !== undefined) question.maxMarks = Number(maxMarks);

    const updated = await question.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a question
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    await Exam.findByIdAndUpdate(question.exam, { $pull: { questions: question._id } });
    await question.deleteOne();

    res.json({ message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all questions for an exam
const getQuestionsByExam = async (req, res) => {
  try {
    const questions = await Question.find({ exam: req.params.examId });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { addQuestion, updateQuestion, deleteQuestion, getQuestionsByExam };