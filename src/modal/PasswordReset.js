const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resetToken: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // Token expires in 5 minutes
  }
}, { timestamps: true });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
