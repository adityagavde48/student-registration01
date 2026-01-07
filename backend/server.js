require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");

// ================= APP INIT =================
const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "../frontend")));

// ================= MODELS =================
const Student = require("./models/Student");
const Course = require("./models/Course");
const Registration = require("./models/Registration");

// ================= MONGODB =================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// ================= ROUTES =================

// Default route → login page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/sign-up.html"));
});

// ================= REGISTER =================
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await Student.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Student.create({
      name,
      email,
      phone,
      password: hashedPassword
    });

    res.json({ message: "Registration successful" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= LOGIN =================
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      studentId: student._id,
      name: student.name
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= DASHBOARD =================
app.get("/api/dashboard/:studentId", async (req, res) => {
  try {
    const regs = await Registration
      .find({ studentId: req.params.studentId })
      .populate("courseId");

    let credits = 0;
    regs.forEach(r => credits += r.courseId.credits);

    res.json({
      registeredCourses: regs.length,
      totalCredits: credits,
      progress: regs.length ? "50%" : "0%"
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= ADD COURSE (ADMIN / MANUAL) =================
app.post("/api/add-course", async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.json({ message: "Course added successfully", course });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= GET COURSES =================
app.get("/api/courses", async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= REGISTER COURSE =================
app.post("/api/register-course", async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    const exists = await Registration.findOne({ studentId, courseId });
    if (exists) {
      return res.status(400).json({ message: "Already registered" });
    }

    const course = await Course.findById(courseId);
    if (!course || course.seats <= 0) {
      return res.status(400).json({ message: "No seats available" });
    }

    await Registration.create({ studentId, courseId });

    course.seats -= 1;
    await course.save();

    res.json({ message: "Course registered successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= MY COURSES =================
app.get("/api/my-courses/:studentId", async (req, res) => {
  try {
    const data = await Registration
      .find({ studentId: req.params.studentId })
      .populate("courseId");

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= ENTER MARKS =================
app.post("/api/enter-marks", async (req, res) => {
  try {
    const { studentId, courseId, marks } = req.body;

    if (marks < 0 || marks > 100) {
      return res.status(400).json({ message: "Marks must be between 0 and 100" });
    }

    const reg = await Registration.findOne({ studentId, courseId });
    if (!reg) {
      return res.status(400).json({ message: "Course not registered" });
    }

    reg.marks = marks;
    await reg.save();

    res.json({ message: "Marks saved successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
