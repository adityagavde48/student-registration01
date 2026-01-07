const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },

    marks: {
      type: Number,
      default: null,
      min: 0,
      max: 100
    }
  },
  { timestamps: true }
);

/* 🚫 Prevent duplicate registration */
registrationSchema.index(
  { studentId: 1, courseId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Registration", registrationSchema);
