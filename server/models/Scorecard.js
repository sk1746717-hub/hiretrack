import mongoose from "mongoose";

const scorecardSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    communicationScore: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    technicalScore: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    problemSolvingScore: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    cultureFitScore: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    overallRecommendation: {
      type: String,
      enum: ["Strong Hire", "Hire", "Hold", "Reject"],
      required: true,
    },
    interviewerComments: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Scorecard = mongoose.model("Scorecard", scorecardSchema);
export default Scorecard;
