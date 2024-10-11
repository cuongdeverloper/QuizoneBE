const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: function() { return !this.socialLogin; }, unique: true },
  password: { type: String, required: function() { return !this.socialLogin; } },
  role: { type: String, enum: ['teacher', 'student', 'admin'], required: true, default: 'student' },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String ,required: function() { return !this.socialLogin; }}, // Use `sparse` index to allow `null`
  gender: { type: String, enum: ['male', 'female', 'other'], required: function() { return !this.socialLogin; } },
  type: {
    type: String,
    default: 'Local'
  },
  socialLogin: {
    type: Boolean,
    default: false
  },
  image:{
    type:String
  },
  balance: { 
    type: Number,
    default: 0
  },
  verified:{
    type:Boolean,
    default:false
  }
}, { timestamps: true });




// Hash password trước khi lưu
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// So sánh password
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
