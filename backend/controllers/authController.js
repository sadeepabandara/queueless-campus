const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const rateLimit = require("../middleware/rateLimit");

// ================= REGISTER USER =================
exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, studentId, email, password, role } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !studentId || !email || !password || !role) {
      return res.status(400).json({
        message: "Please provide all required fields."
      });
    }

    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase();

    // Validate email format
    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({
        message: "Invalid email format."
      });
    }

    // Password validation
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters long and include both letters and numbers."
      });
    }

    // Restrict roles
    const allowedRoles = ["student", "staff"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role selected."
      });
    }

    // Check if email exists
    const emailExists = await User.findOne({ email: normalizedEmail });
    if (emailExists) {
      return res.status(409).json({
        message: "Email already registered."
      });
    }

    // Check if studentId exists
    const studentIdExists = await User.findOne({ studentId });
    if (studentIdExists) {
      return res.status(409).json({
        message: "Student/Staff ID already registered."
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      studentId,
      email: normalizedEmail,
      password: hashedPassword,
      role
    });

    console.log("User created successfully:", user._id);

    // Create JWT token
    console.log("Generating JWT token with secret:", process.env.JWT_SECRET ? "secret present" : "MISSING!");
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    console.log("Token generated successfully");

    res.status(201).json({
      message: "Account created successfully!",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: user.studentId,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Registration failed.",
      error: error.message
    });
  }
};

// ================= LOGIN USER =================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase();

    // Validate email format
    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({
        message: "Invalid email format."
      });
    }

    // Find user
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Record failed attempt even if user doesn't exist (security)
      rateLimit.recordFailedAttempt(req);
      const attemptInfo = rateLimit.getAttemptInfo(req);
      const remaining = Math.max(0, 5 - (attemptInfo?.attempts || 0));
      
      return res.status(401).json({
        message: "Invalid email or password.",
        attemptsRemaining: remaining,
        locked: attemptInfo?.lockedUntil ? true : false
      });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      // Record failed attempt
      const attemptData = rateLimit.recordFailedAttempt(req);
      
      if (attemptData.locked) {
        const remainingTime = Math.ceil((attemptData.lockedUntil - Date.now()) / 1000 / 60);
        return res.status(429).json({
          message: `Too many failed login attempts. Account locked for ${remainingTime} minutes.`,
          retryAfter: Math.ceil((attemptData.lockedUntil - Date.now()) / 1000),
          locked: true
        });
      }
      
      return res.status(401).json({
        message: "Invalid email or password.",
        attemptsRemaining: attemptData.remaining,
        locked: false
      });
    }

    // Success - reset rate limit
    rateLimit.recordSuccess(req);

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        studentId: user.studentId
      }
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({
      message: "Login failed.",
      error: error.message
    });
  }
};


exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    res.status(200).json({
      message: "Profile fetched successfully.",
      user
    });
  } catch (error) {
    console.error("PROFILE ERROR:", error);
    res.status(500).json({
      message: "Something went wrong. Please try again later."
    });
  }
};
