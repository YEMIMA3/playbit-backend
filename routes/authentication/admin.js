const express = require("express");
const multer = require("multer");
const adminAuth = require("../../middlewares/authentication/admin");
const {
  adminSignup,
  adminLogin,
  getPendingCoaches,
  verifyCoachCertificate,
} = require("../../controllers/authentication/admin");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// AUTH
router.post("/signup", adminSignup);
router.post("/login", adminLogin);

// GET all pending coaches
router.get("/pending-coaches", adminAuth, getPendingCoaches);

// VERIFY certificate and upload new verified URL
router.post("/verify/:coachId", adminAuth, upload.single("certificate"), verifyCoachCertificate);

module.exports = router;
