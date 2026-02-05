const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getProfile
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

// Register Route
router.post("/signup", registerUser);

// Login Route
router.post("/login", loginUser);

// Protected Route (Test JWT Token)
router.get("/profile", authMiddleware, getProfile);

module.exports = router;