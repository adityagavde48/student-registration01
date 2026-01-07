const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },

    title: {
      type: String,
      required: true
    },

    instructor: {
      type: String,
      required: true
    },

    schedule: {
      type: String,
      required: true
    },

    credits: {
      type: Number,
      required: true,
      min: 1,
      max: 6
    },

    seats: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
