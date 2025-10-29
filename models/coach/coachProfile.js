const mongoose = require("mongoose");

const CoachProfileSchema = new mongoose.Schema(
  {
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "coachcredentials",
      required: true,
      unique: true,
    },
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    location: { type: String },
    bio: { type: String },
    sports: [{ type: String }],
    certifications: [{ type: String }],
    hourlyRate: { type: String },
    experience: { type: String },
    availability: { type: String },
    achievements: [{ type: String }],
    profileImage: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("coachprofile", CoachProfileSchema);