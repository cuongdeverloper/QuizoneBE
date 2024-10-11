// models/Exam.js
const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true 
  },
  questionPack: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionPack', 
    required: true
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flashcard' 
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  duration: { 
    type: Number,
    required: true,
    default: 60
  },
  instructions: { 
    type: String
  }
});

module.exports = mongoose.model('Exam', examSchema);
