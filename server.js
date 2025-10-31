const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors"); // Add CORS for frontend communication

// Import routes
const coachAuthRoutes = require("./routes/authentication/coach");
const athleteAuthRoutes = require("./routes/authentication/athlete");
const coachProfileRoutes = require('./routes/coach/coachProfile');
const athleteProfileRoutes = require('./routes/athlete/athleteprofile');
const adminRoutes = require("./routes/authentication/admin");


dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173", // or whatever your frontend runs on
  credentials: true,
}));

app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/playbit")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ DB Error:", err));

// Routes
app.use("/api/auth/coach", coachAuthRoutes); // Fixed path
app.use("/api/auth/athlete", athleteAuthRoutes); // Fixed path
app.use('/api/coach/profile', coachProfileRoutes);
app.use('/api/athlete/profile', athleteProfileRoutes);
app.use("/api/admin", adminRoutes);



// Start server
const PORT = process.env.PORT || 5000; // Changed to 5000
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));