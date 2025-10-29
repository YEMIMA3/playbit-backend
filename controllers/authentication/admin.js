const Admin = require("../../models/authentication/admin");
const Coach = require("../../models/authentication/coach");
const uploadToCloudinary = require("../../utils/uploadToCloudinary");
const verifyCertificate = require("../../utils/verifyCertificate");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ===================
// ADMIN SIGNUP
// ===================
exports.adminSignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await Admin.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Admin already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const newAdmin = await Admin.create({ name, email, password: hashed });
    res.status(201).json({ message: "Admin created successfully", admin: newAdmin });
  } catch (err) {
    res.status(500).json({ message: "Error creating admin", error: err.message });
  }
};

// ===================
// ADMIN LOGIN
// ===================
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin)
      return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// ===================
// FETCH PENDING COACHES
// ===================
exports.getPendingCoaches = async (req, res) => {
  try {
    const coaches = await Coach.find({ isVerified: false });
    res.status(200).json(coaches);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pending coaches", error: err.message });
  }
};

// ===================
// VERIFY COACH CERTIFICATE
// ===================
exports.verifyCoachCertificate = async (req, res) => {
  try {
    const coachId = req.params.coachId;
    const { sport, certificateName } = req.body;
    const file = req.file;

    if (!file)
      return res.status(400).json({ message: "Certificate file required" });

    // Step 1: Validate the certificate against predefined data
    const validation = verifyCertificate(sport, certificateName);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.reason });
    }

    // Step 2: Upload to Cloudinary
    const verifiedCertificateUrl = await uploadToCloudinary(file.path);

    // Step 3: Update the coach record
    const coach = await Coach.findByIdAndUpdate(
      coachId,
      {
        isVerified: true,
        verifiedCertificateUrl,
        verifiedAuthority: validation.authority,
      },
      { new: true }
    );

    res.status(200).json({
      message: "Coach certificate verified successfully",
      coach,
    });
  } catch (err) {
    res.status(500).json({ message: "Verification failed", error: err.message });
  }
};
