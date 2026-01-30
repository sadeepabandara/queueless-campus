const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");


// ================= REGISTER USER =================

exports.registerUser = async (req, res) => {
  try {

    const { email, password, role } = req.body;

    // ✅ Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Please provide email, password, and role."
      });
    }

    // ✅ Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: "Invalid email format."
      });
    }

    // ✅ Password strength validation
    const strongPassword =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/;

    if (!strongPassword.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters long and include a number and special character."
      });
    }

    // ✅ Restrict roles (Prevents users registering as admin)
    const allowedRoles = ["student", "staff"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role selected."
      });
    }

    // ✅ Check existing user
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(409).json({
        message: "User already exists."
      });
    }

    // ✅ Hash password (12 rounds = stronger security)
    const hashedPassword = await bcrypt.hash(password, 12);

    // ✅ Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      role
    });

    res.status(201).json({
      message: "User registered successfully."
    });

  } catch (error) {

    console.error("REGISTER ERROR:", error);

    res.status(500).json({
      message: "Something went wrong. Please try again later."
    });
  }
};



// ================= LOGIN USER =================

exports.loginUser = async (req, res) => {
  try {

    const { email, password } = req.body;

    // ✅ Validate fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    // ✅ Find user
    const user = await User.findOne({ email });

    // 🔐 Prevent brute-force enumeration
    if (!user) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    // ✅ Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    // ✅ Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h"
      }
    );

    res.status(200).json({
      message: "Login successful.",
      token
    });

  } catch (error) {

    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      message: "Something went wrong. Please try again later."
    });
  }
};