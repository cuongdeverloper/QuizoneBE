const mongoose = require('mongoose');
const Comment = require('./Comment');

const questionPackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true 
  },
  description: {
    type: String
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  semester: {
    type: String,
    required: true
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flashcard'
  }],
  subject: {
    type: String,
    required: true
  },
  imagePreview: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    default: null
  },
  isPublic: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('QuestionPack', questionPackSchema);
