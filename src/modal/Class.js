const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true 
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' 
  }],
  questionPacks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionPack' 
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  invitationLink: { type: String }, 

});

module.exports = mongoose.model('Class', classSchema);
