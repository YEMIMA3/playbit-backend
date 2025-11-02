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

// Middleware - Fix CORS configuration
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"], // Add both common frontend ports
  credentials: true,
}));

app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/playbit")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ DB Error:", err));

// Routes - Make sure athlete routes are included
app.use("/api/auth/coach", coachAuthRoutes);
app.use('/api/auth/athlete', require('./routes/authentication/athlete'));
app.use('/api/athlete/profile', require('./routes/athlete/athleteprofile'));
app.use('/api/coach/profile', coachProfileRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/admin/tournaments', require('./routes/admin/tournaments'));
app.use('/api/coach/tournaments', require('./routes/coach/tournaments'));
app.use('/api/athlete/tournaments', require('./routes/athlete/tournaments')); // This line is crucial
app.use('/api/admin/coaches', require('./routes/admin/coaches'));
app.use('/api/admin/athletes', require('./routes/admin/athlete'));

// Add a test route to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is working!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));