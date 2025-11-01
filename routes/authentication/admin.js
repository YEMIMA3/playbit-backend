const express = require("express");
const multer = require("multer");
const { verifyAdmin } = require("../../middlewares/authentication/admin");
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

router.get("/pending-coaches", verifyAdmin, getPendingCoaches);
router.post("/verify/:coachId", verifyAdmin, upload.single("certificate"), verifyCoachCertificate);


module.exports = router;