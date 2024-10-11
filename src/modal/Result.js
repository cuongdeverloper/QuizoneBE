const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  answers: [{
    questionId: mongoose.Schema.Types.ObjectId,
    selectedAnswers: [String], // Store the student's selected answers
    isCorrect: Boolean
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Result', resultSchema);
