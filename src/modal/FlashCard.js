const mongoose = require('mongoose');


// Define the flashcard schema
const flashcardSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: false
  },
  questionImage: {
    type: String,
    required: false 
  },
  answers: {
    type: [String], 
    required: true,
    validate: {
      validator: function(val) {
        return val.length > 1 && val.length <= 4; // Ensure between 2 and 4 answers
      },
      message: 'There must be between 2 and 4 answers'
    }
  },
  correctAnswers: {
    type: [Number],
    required: true,
    validate: {
      validator: function(indices) {
        return indices.every(index => index >= 0 && index < this.answers.length);
      },
      message: 'All correct answer indices must be within the bounds of the answers array'
    }
  },
  questionPack: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionPack', 
    required: true
  },
  comments: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment' 
  }], // Added comments field
}, { timestamps: true });

module.exports = mongoose.model('Flashcard', flashcardSchema);
