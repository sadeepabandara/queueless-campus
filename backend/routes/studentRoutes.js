const express = require("express");
const router = express.Router();

router.get("/student", (req, res) => {
    res.json({
        name: "Dhwani Pankajkumar Takor",
        studentId: "S225731075"
    });
});

module.exports = router;