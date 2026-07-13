import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    experience: {
      type: String,
      default: "",
    },
    salary: {
      type: String,
      default: "",
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Active", "Closed", "Draft"],
      default: "Active",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedRecruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedInterviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Job = mongoose.model("Job", jobSchema);

export default Job;
