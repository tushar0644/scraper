const mongoose = require('mongoose');

/**
 * User Schema mapping OTP authentication details
 * Stored internally in the database / admin panel later
 */
const UserSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits.']
  },
  otpVerified: {
    type: Boolean,
    default: false
  },
  loginTime: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

// Export the model
module.exports = mongoose.model('User', UserSchema);
