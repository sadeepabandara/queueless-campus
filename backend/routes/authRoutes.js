const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  registerUser,
  loginUser
} = require("../controllers/authController");


// ================= PUBLIC ROUTES =================

// Register user
router.post("/register", registerUser);

// Login user
router.post("/login", loginUser);



// ================= PROTECTED ROUTES =================

// Student only
router.get("/student",  (req, res) => {
  res.status(200).json({
    message: "Welcome Dhwani Pankajkumar Takor!",
     studentId: "s225731075"
    });
});


// Staff only example (VERY good for assignments)
router.get("/staff", auth("staff"), (req, res) => {
  res.status(200).json({
    message: "Welcome Staff!",
    user: req.user
  });
});


// Multiple roles example ⭐ (Industry practice)
router.get("/dashboard", auth(["student", "staff"]), (req, res) => {
  res.status(200).json({
    message: "Dashboard accessed successfully",
    user: req.user
  });
});

router.get("/student",  (req, res) => {
  res.status(200).json({
    message: "Welcome Dhwani Pankajkumar Takor!",
     studentId: "s225731075"
    });
});

module.exports = router;

