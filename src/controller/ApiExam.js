const Class = require("../modal/Class");
const Exam = require("../modal/Exam");
const QuestionPack = require("../modal/QuestionPack");

const addExam = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { classId, questionPackId, title, duration, instructions } = req.body;

    // 1. Check if the question pack belongs to the teacher
    const questionPackData = await QuestionPack.findById(questionPackId);
    if (!questionPackData || questionPackData.teacher.toString() !== teacherId) {
      return res.status(403).json({ error: 'You do not own this question pack.' });
    }

    // 2. Check if the teacher is authorized for the class
    const classInfo = await Class.findById(classId);
    if (!classInfo || classInfo.teacher.toString() !== teacherId) {
      return res.status(403).json({ error: 'You are not authorized to create exams for this class.' });
    }

    // 3. Create a new exam from the question pack
    const newExam = new Exam({
      title,
      questionPack: questionPackId,
      questions: questionPackData.questions, // Assuming questions are stored in the question pack
      duration: duration || 60,
      instructions: instructions || '', // Optional field
    });

    await newExam.save();

    // 4. Ensure classInfo.exams array exists before pushing the new exam
    classInfo.exams = classInfo.exams || []; // Initialize the exams array if it doesn't exist
    classInfo.exams.push(newExam._id);
    await classInfo.save();

    res.status(201).json({ success: true, message: 'Exam created successfully', exam: newExam });

  } catch (error) {
    console.error('Error adding exam:', error);
    res.status(500).json({ error: 'An error occurred while adding the exam.' });
  }
};

const getExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId)
      .populate({
        path: 'questionPack', // Populate the question pack
        model: 'QuestionPack',
        select: 'title description subject', // Select only the necessary fields
      })
      .populate({
        path: 'questions', // Populate the flashcards (questions)
        model: 'Flashcard',
      });

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    // Map through the questions to replace correctAnswers indices with actual answer values
    const updatedQuestions = exam.questions.map(question => {
      const correctAnswerValues = question.correctAnswers.map(index => question.answers[index]);
      return {
        ...question.toObject(), // Convert mongoose document to plain object
        correctAnswers: correctAnswerValues // Replace indices with actual values
      };
    });

    res.status(200).json({ success: true, exam: { ...exam.toObject(), questions: updatedQuestions } });
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ error: 'An error occurred while fetching the exam.' });
  }
};
const getExamByQuestionPack = async (req, res) => {
  try {
    const { questionPackId } = req.params; // Get the questionPackId from the URL

    // Find a single exam related to the given questionPackId
    const exam = await Exam.findOne({ questionPack: questionPackId })
      .populate({
        path: 'questionPack', // Populate the related question pack details
        select: 'title description subject', // Select only necessary fields
      })
      .populate({
        path: 'questions', // Populate the questions (flashcards)
        // Select only necessary fields from Flashcards
      });

    if (!exam) {
      return res.status(203).json({ error: 'No exam found for this question pack.' });
    }

    // Process the exam and replace correctAnswers indices with actual answer values
    const updatedQuestions = exam.questions.map(question => {
      const correctAnswerValues = question.correctAnswers.map(index => question.answers[index]);
      return {
        ...question.toObject(), // Convert the question to a plain object
        correctAnswers: correctAnswerValues // Replace indices with actual values
      };
    });

    const updatedExam = {
      ...exam.toObject(), // Convert the exam to a plain object
      questions: updatedQuestions // Update the questions array
    };

    res.status(200).json({ success: true, exam: updatedExam });
  } catch (error) {
    console.error('Error fetching exam by question pack:', error);
    res.status(500).json({ error: 'An error occurred while fetching the exam.' });
  }
};



module.exports = { addExam,getExam,getExamByQuestionPack };
