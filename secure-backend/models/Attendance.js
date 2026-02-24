const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    trim: true,
  },
  studentName: {
    type: String,
    required: true,
    trim: true,
  },
  sessionId: {
    type: String,
    required: true,
    ref: 'Session'
  },
  ipAddress: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    required: true,
  },
  deviceFingerprint: {
    type: String,
    default: null, // Optional tracking identifier
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

// 2️⃣ Duplicate Student ID Protection: Unique index on (studentId + sessionId)
attendanceSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });

// Optional: Index for IP restriction check per session
attendanceSchema.index({ ipAddress: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
