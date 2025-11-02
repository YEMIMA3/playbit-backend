const mongoose = require("mongoose");

const coachRequestSchema = new mongoose.Schema(
  {
    athleteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "athleteprofile", // This is correct since you have AthleteProfile collection
      required: true,
    },
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "coachprofile", // This is correct since you have CoachProfile collection
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    message: {
      type: String,
      default: "I would like to train with you!"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CoachRequest", coachRequestSchema);