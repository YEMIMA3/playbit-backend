const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");

// Import routes
const coachAuthRoutes = require("./routes/authentication/coach");
const coachProfileRoutes = require('./routes/coach/coachProfile');
const adminRoutes = require("./routes/authentication/admin");

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/playbit")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ DB Error:", err));

// Routes - CRITICAL: Make sure athlete auth route exists
app.use("/api/auth/coach", coachAuthRoutes);
app.use('/api/auth/athlete', require('./routes/authentication/athlete')); // This must exist!
app.use('/api/athlete/profile', require('./routes/athlete/athleteprofile'));
app.use('/api/coach/profile', coachProfileRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/admin/tournaments', require('./routes/admin/tournaments'));
app.use('/api/coach/tournaments', require('./routes/coach/tournaments'));
app.use('/api/athlete/tournaments', require('./routes/athlete/tournaments'));
app.use('/api/admin/coaches', require('./routes/admin/coaches'));
app.use('/api/admin/athletes', require('./routes/admin/athlete'));

// 🔥 COACH-ATHLETE REQUEST ROUTES
app.use('/api/athlete/find-coaches', require('./routes/athlete/findCoaches'));
app.use('/api/coach/requests', require('./routes/coach/requestRoutes')); // Fixed filename
 
// Add this to server.js BEFORE your routes
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.originalUrl}`);
  next();
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));