const mongoose = require('mongoose');
const uploadCloud = require("../config/cloudinaryConfig");
const QuestionPack = require('../modal/QuestionPack');
const FlashCard = require('../modal/FlashCard');
const Class = require('../modal/Class');


const addQuestionFlashCard = (req, res) => {
  // Use multer to handle the image upload
  uploadCloud.single('imagePreview')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        errorCode: 4,
        message: `Upload Error: ${err.message}`
      });
    }

    const { questionText, answers, correctAnswers, questionPackId } = req.body;
    const imagePreview = req.file ? req.file.path : null; // Retrieve the uploaded image path

    // Validate required fields
    if (!questionPackId) {
      return res.status(400).json({
        errorCode: 5,
        message: 'questionPackId is required'
      });
    }

    if (!questionText && !imagePreview) {
      return res.status(400).json({
        errorCode: 5,
        message: 'Either questionText or imagePreview is required'
      });
    }

    if (!answers || !correctAnswers) {
      return res.status(400).json({
        errorCode: 5,
        message: 'answers and correctAnswers are required'
      });
    }

    try {
      // Check if the QuestionPack exists
      const questionPack = await QuestionPack.findById(questionPackId);
      if (!questionPack) {
        return res.status(404).json({
          errorCode: 6,
          message: 'QuestionPack not found'
        });
      }

      // Parse answers and correctAnswers if sent as JSON strings
      const parsedAnswers = typeof answers === 'string' ? JSON.parse(answers) : answers;
      const parsedCorrectAnswers = typeof correctAnswers === 'string' ? JSON.parse(correctAnswers) : correctAnswers;

      // Create a new Flashcard
      const newFlashcard = new FlashCard({
        questionText: questionText || null, // Handle text-based question
        questionImage: imagePreview || null, // Handle image-based question
        answers: parsedAnswers,
        correctAnswers: parsedCorrectAnswers,
        questionPack: questionPackId
      });

      // Save the Flashcard
      await newFlashcard.save();

      // Add the Flashcard reference to the QuestionPack's questions array
      questionPack.questions.push(newFlashcard._id);
      await questionPack.save();

      return res.status(201).json({
        errorCode: 0,
        message: 'Flashcard added successfully',
        data: newFlashcard
      });
    } catch (error) {
      console.error('Error adding flashcard:', error);
      return res.status(500).json({
        errorCode: 7,
        message: 'An error occurred while adding the flashcard'
      });
    }
  });
};


const getQuestionFlashCardByQuestionPackId = async (req, res) => {
  try {
    const { questionPackId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find the QuestionPack by ID and populate the questions (flashcards)
    const questionPack = await QuestionPack.findById(questionPackId).populate('questions').lean();

    // Check if the QuestionPack exists
    if (!questionPack) {
      return res.status(404).json({
        errorCode: 6,
        message: 'QuestionPack not found'
      });
    }

    // Check if the QuestionPack is private and the classId is not null
    if (!questionPack.isPublic && questionPack.classId !== null) {
      const classData = await Class.findById(questionPack.classId).lean();

      // If the class doesn't exist
      if (!classData) {
        return res.status(404).json({
          errorCode: 7,
          message: 'Class not found'
        });
      }

      // Check if the user is a student in the class or the teacher/admin
      const isStudentInClass = classData.students.some(student => student.toString() === userId);
      const isTeacher = classData.teacher.toString() === userId;
      
      if (!(isStudentInClass || isTeacher || userRole === 'admin')) {
        return res.status(403).json({
          errorCode: 2,
          message: 'Access denied: Only students in the class, the teacher, or an admin can view this question pack.'
        });
      }
    } else if (!questionPack.isPublic && questionPack.classId === null) {
      // If question pack is private but not associated with a class
      if (questionPack.teacher._id.toString() !== userId && userRole !== 'admin') {
        return res.status(403).json({
          errorCode: 2,
          message: 'Access denied: Only the teacher or admin can view this question pack.'
        });
      }
    }

    // Check if the QuestionPack has any flashcards
    if (!questionPack.questions || questionPack.questions.length === 0) {
      return res.status(200).json({
        errorCode: 0,
        message: 'QuestionPack retrieved successfully, but no flashcards found',
        data: questionPack
      });
    }

    // Return the QuestionPack with its flashcards
    return res.status(200).json({
      errorCode: 0,
      message: 'QuestionPack and its flashcards retrieved successfully',
      data: questionPack
    });

  } catch (error) {
    console.error('Error retrieving QuestionPack:', error);
    return res.status(500).json({
      errorCode: 7,
      message: 'An error occurred while retrieving the QuestionPack',
      error: error.message // Provide more detail on the error
    });
  }
};


const updateFlashcard = (req, res) => {
  // Use multer to handle the image upload
  uploadCloud.single('imagePreview')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        errorCode: 4,
        message: `Upload Error: ${err.message}`
      });
    }

    const { questionText, answers, correctAnswers } = req.body;
    const imagePreview = req.file ? req.file.path : null; // Retrieve the uploaded image path
    const flashcardId = req.params.flashcardId; // Assuming you pass the flashcard ID in the URL

    try {
      // Find the Flashcard by ID
      const flashcard = await FlashCard.findById(flashcardId);
      if (!flashcard) {
        return res.status(404).json({
          errorCode: 6,
          message: 'Flashcard not found'
        });
      }

      // Update fields
      flashcard.questionText = questionText || flashcard.questionText; // Update if provided, else retain current value
      flashcard.questionImage = imagePreview || flashcard.questionImage; // Update image if provided
      flashcard.answers = answers ? (typeof answers === 'string' ? JSON.parse(answers) : answers) : flashcard.answers; // Update answers
      flashcard.correctAnswers = correctAnswers ? (typeof correctAnswers === 'string' ? JSON.parse(correctAnswers) : correctAnswers) : flashcard.correctAnswers; // Update correct answers

      // Save the updated Flashcard
      await flashcard.save();

      return res.status(200).json({
        errorCode: 0,
        message: 'Flashcard updated successfully',
        data: flashcard
      });
    } catch (error) {
      console.error('Error updating flashcard:', error);
      return res.status(500).json({
        errorCode: 7,
        message: 'An error occurred while updating the flashcard'
      });
    }
  });
};


const deleteFlashcard = async (req, res) => {
  const flashcardId = req.params.flashcardId; 
  const userId = req.user.id; 

  try {
    // Find the Flashcard by ID
    const flashcard = await FlashCard.findById(flashcardId);
    if (!flashcard) {
      return res.status(404).json({
        errorCode: 6,
        message: 'Flashcard not found'
      });
    }

    // Find the associated QuestionPack
    const questionPack = await QuestionPack.findById(flashcard.questionPack);
    if (!questionPack) {
      return res.status(404).json({
        errorCode: 6,
        message: 'QuestionPack not found'
      });
    }

    // Check if the logged-in user is the owner (teacher) of the QuestionPack
    if (questionPack.teacher.toString() !== userId) {
      return res.status(403).json({
        errorCode: 2,
        message: 'Access denied: Only the owner (teacher) of this QuestionPack can delete flashcards'
      });
    }

    // Remove the flashcard reference from the QuestionPack's questions array
    questionPack.questions = questionPack.questions.filter(
      questionId => questionId.toString() !== flashcardId
    );

    // Save the updated QuestionPack
    await questionPack.save();

    // Delete the Flashcard using findByIdAndDelete
    await FlashCard.findByIdAndDelete(flashcardId);

    return res.status(200).json({
      errorCode: 0,
      message: 'Flashcard deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    return res.status(500).json({
      errorCode: 7,
      message: 'An error occurred while deleting the flashcard'
    });
  }
};
module.exports = { addQuestionFlashCard, getQuestionFlashCardByQuestionPackId,updateFlashcard,deleteFlashcard };
