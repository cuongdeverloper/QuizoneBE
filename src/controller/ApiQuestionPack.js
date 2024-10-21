const mongoose = require('mongoose');
const uploadCloud = require("../config/cloudinaryConfig");
const QuestionPack = require('../modal/QuestionPack');
const User = require('../modal/User'); // Assuming the User model is imported
const Class = require('../modal/Class');

const createQuestionPack = async (req, res) => {
  uploadCloud.single('imagePreview')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        errorCode: 4,
        message: `Upload Error: ${err.message}`
      });
    }

    const { title, description, teacher, semester, questions, subject, classId, isPublic } = req.body;
    const imagePreview = req.file ? req.file.path : null;

    // Validate required fields
    if (!title || !teacher || !semester || !subject) {
      return res.status(400).json({
        errorCode: 5,
        message: 'All required fields must be provided'
      });
    }

    try {
      // Check if the authenticated user is a teacher
      const authenticatedUser = req.user;
      if (authenticatedUser.role !== 'teacher' && authenticatedUser.role !== 'admin') {
        return res.status(403).json({
          errorCode: 7,
          message: 'Only teachers can create question packs'
        });
      }

   

      // Check if classId is provided and valid
      let classInfo = null;
      if (classId) {
        classInfo = await Class.findById(classId);
        if (!classInfo) {
          return res.status(404).json({
            errorCode: 9,
            message: 'Class not found'
          });
        }
      }
      const isPublicValue = isPublic === 'true' || isPublic === true; 
      // Create the new question pack
      const newQuestionPack = new QuestionPack({
        title,
        description,
        teacher: new mongoose.Types.ObjectId(teacher),
        semester,
        questions: questions ? questions.map(q => mongoose.Types.ObjectId(q)) : [],
        subject,
        imagePreview,
        classId: classInfo ? new mongoose.Types.ObjectId(classId) : null,
        isPublic:isPublicValue
      });

      await newQuestionPack.save();

      return res.status(201).json({
        errorCode: 0,
        message: 'Question pack created successfully',
        data: newQuestionPack
      });
    } catch (saveError) {
      console.error('Error saving question pack:', saveError);
      return res.status(500).json({
        errorCode: 6,
        message: 'An error occurred while saving the question pack'
      });
    }
  });
};

const getAllQuestionPack = async (req, res) => {
  try {
    // Retrieve all public question packs from the database (isPublic = true)
    const questionPacks = await QuestionPack.find({ isPublic: true })
      .populate('teacher', 'name email') // populate the teacher's name and email
      .populate('questions', 'content'); // populate the questions' content

    // Send the public question packs as the response
    return res.status(200).json({
      errorCode: 0,
      message: 'Public question packs retrieved successfully',
      data: questionPacks
    });
  } catch (err) {
    console.error('Error fetching question packs:', err);
    return res.status(500).json({
      errorCode: 6,
      message: 'An error occurred while fetching the question packs'
    });
  }
};

const getAllQuestionPackByAd = async(req,res) =>{
  try {
    const user = req.user;
    if(user.role !== 'admin') {
      return res.status(500).json({
        errorCode: 5,
        message: 'Only admin can access this.'
      });
    }
    const questionPacks = await QuestionPack.find({ })
      .populate('teacher', 'name email') 

    // Send the public question packs as the response
    return res.status(200).json({
      errorCode: 0,
      message: 'Public question packs retrieved successfully',
      data: questionPacks
    });
  } catch (err) {
    console.error('Error fetching question packs:', err);
    return res.status(500).json({
      errorCode: 6,
      message: 'An error occurred while fetching the question packs'
    });
  }
}
const searchQuestionPack = async (req, res) => {
  const { query } = req.query;

  try {
    // Perform the search query with regex on multiple fields
    const questionPacks = await QuestionPack.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },    
        { semester: { $regex: query, $options: 'i' } }, 
        { subject: { $regex: query, $options: 'i' } }    
      ]
    })
    .populate('teacher', 'name email') 
    .populate('questions', 'content');

    // If no results are found, return a success response with an empty array
    if (questionPacks.length === 0) {
      return res.status(200).json({
        errorCode: 0,
        message: 'No question packs found',
        data: [] // Return an empty array
      });
    }

    // Return the found question packs
    return res.status(200).json({
      errorCode: 0,
      message: 'Question packs found',
      data: questionPacks
    });

  } catch (err) {
    console.error('Error searching question packs:', err);
    return res.status(500).json({
      errorCode: 6,
      message: 'An error occurred while searching the question packs'
    });
  }
};
const addQuestionPackToClass = async (req, res) => {
  try {
    const { classId, questionPackId } = req.body; 
    const authenticatedUser = req.user;

    // Check if the class exists
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        errorCode: 1,
        message: 'Class not found'
      });
    }

    // Check if the user is authorized (the teacher of the class)
    if (classData.teacher.toString() !== authenticatedUser.id.toString()) {
      return res.status(403).json({
        errorCode: 7,
        message: 'You are not authorized to add question packs to this class'
      });
    }

    // Check if the question pack exists
    const questionPack = await QuestionPack.findById(questionPackId);
    if (!questionPack) {
      return res.status(404).json({
        errorCode: 8,
        message: 'Question pack not found'
      });
    }

    // Check if the question pack is already in the class
    if (classData.questionPacks.includes(questionPackId)) {
      return res.status(200).json({  // Using status 200 as it's a valid response (can be 409 for conflict)
        errorCode: 10,
        message: 'Question pack already exists in this class',
        data: classData
      });
    }

    // Add the question pack to the class
    classData.questionPacks.push(questionPackId);
    await classData.save();

    return res.status(200).json({
      errorCode: 0,
      message: 'Question pack added to the class successfully',
      data: classData
    });

  } catch (error) {
    console.error('Error adding question pack to class:', error);
    return res.status(500).json({
      errorCode: 6,
      message: 'An error occurred while adding the question pack to the class'
    });
  }
};

const getQuestionPackById = async (req, res) => {
  try {
    const { questionPackId } = req.params;
    const userId= req.user.id
    // Populate the teacher field and questions
    const questionPack = await QuestionPack.findById(questionPackId)
      .populate('teacher', 'username image')
      .populate({
        path: 'questions',
        model: 'Flashcard',
        select: 'questionText answers correctAnswers',
      });

    if (!questionPack) {
      return res.status(404).json({
        errorCode: 1,
        message: 'Question pack not found'
      });
    }
if((!questionPack.isPublic && questionPack.classId === null )){
  if (questionPack.teacher._id.toString() !== userId) {
    return res.status(200).json({
      errorCode: 2,
      message: 'Access denied: Only the teacher can view this question pack.'
    });
  }
}
    // Transform the flashcards to include correct answer values
    const transformedQuestions = questionPack.questions.map(flashcard => {
      const correctAnswerValues = flashcard.correctAnswers.map(index => flashcard.answers[index]);
      return {
        questionText: flashcard.questionText,
        answers: flashcard.answers,
        correctAnswers: correctAnswerValues, // Return the actual values of correct answers
      };
    });

    return res.status(200).json({
      errorCode: 0,
      message: 'Question pack retrieved successfully',
      data: {
        ...questionPack._doc, // Spread operator to copy existing question pack properties
        questions: transformedQuestions // Use the transformed questions
      }
    });
  } catch (err) {
    console.error('Error fetching question pack:', err);
    return res.status(500).json({
      errorCode: 6,
      message: 'An error occurred while fetching the question pack'
    });
  }
};

const getAllQuestionPacksForTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params; 

    const authenticatedUser = req.user;

    if (authenticatedUser.role !== 'teacher' && authenticatedUser.role !== 'admin') {
      return res.status(403).json({
        errorCode: 7,
        message: 'You are not authorized to view question packs'
      });
    }

    const questionPacks = await QuestionPack.find({ teacher: teacherId })


    if (questionPacks.length === 0) {
      return res.status(200).json({
        errorCode: 0,
        message: 'No question packs found for this teacher',
        data: []
      });
    }

    return res.status(200).json({
      errorCode: 0,
      message: 'Question packs retrieved successfully',
      data: questionPacks
    });
  } catch (err) {
    console.error('Error fetching question packs for teacher:', err);
    return res.status(500).json({
      errorCode: 6,
      message: 'An error occurred while fetching the question packs'
    });
  }
};


const updateQuestionPack = async (req, res) => {
  uploadCloud.single('imagePreview')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        errorCode: 4,
        message: `Upload Error: ${err.message}`
      });
    }

    const { title, description, semester, subject, classId, isPublic } = req.body;
    const { questionpackId } = req.params;  // Extract the questionPackId properly
    const imagePreview = req.file ? req.file.path : null;

    // Validate required fields
    if (!title || !semester || !subject) {
      return res.status(400).json({
        errorCode: 5,
        message: 'All required fields must be provided'
      });
    }

    try {
      // Find the question pack by its ID
      const questionPack = await QuestionPack.findById(questionpackId);
      if (!questionPack) {
        return res.status(404).json({
          errorCode: 9,
          message: 'Question pack not found'
        });
      }

      // If classId is provided, check if the class is valid
      let classInfo = null;
      if (classId) {
        classInfo = await Class.findById(classId);
        if (!classInfo) {
          return res.status(404).json({
            errorCode: 9,
            message: 'Class not found'
          });
        }
      }

      // Update the question pack fields
      questionPack.title = title;
      questionPack.description = description || questionPack.description;
      questionPack.semester = semester;
      questionPack.subject = subject;
      questionPack.imagePreview = imagePreview || questionPack.imagePreview;  
      questionPack.classId = classInfo ? new mongoose.Types.ObjectId(classId) : questionPack.classId;

      // Convert isPublic to a boolean if it is passed as a string
      if (isPublic !== undefined) {
        questionPack.isPublic = (isPublic === 'true' || isPublic === true);  // Convert to boolean
      }

      await questionPack.save();

      return res.status(200).json({
        errorCode: 0,
        message: 'Question pack updated successfully',
        data: questionPack
      });
    } catch (saveError) {
      console.error('Error updating question pack:', saveError);
      return res.status(500).json({
        errorCode: 6,
        message: 'An error occurred while updating the question pack'
      });
    }
  });
};
const deleteQuestionPack = async (req, res) => {
  try {
    const { questionPackId } = req.params;
    const authenticatedUser = req.user;

    // Find the question pack by its ID
    const questionPack = await QuestionPack.findById(questionPackId);

    if (!questionPack) {
      return res.status(404).json({
        errorCode: 1,
        message: 'Question pack not found'
      });
    }

    if (questionPack.teacher.toString() !== authenticatedUser.id && authenticatedUser.role !== 'admin') {
      return res.status(403).json({
        errorCode: 7,
        message: 'You are not authorized to delete this question pack'
      });
    }

    // Delete the question pack
    await QuestionPack.findByIdAndDelete(questionPackId);

    return res.status(200).json({
      errorCode: 0,
      message: 'Question pack deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting question pack:', err);
    return res.status(500).json({
      errorCode: 6,
      message: 'An error occurred while deleting the question pack'
    });
  }
};

module.exports = { createQuestionPack,getAllQuestionPack,searchQuestionPack,
  addQuestionPackToClass,getQuestionPackById,getAllQuestionPacksForTeacher,updateQuestionPack,
getAllQuestionPackByAd ,deleteQuestionPack};
