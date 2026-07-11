import mongoose from "mongoose";

const noteEntrySchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const candidateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: [true, "Candidate full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Candidate email is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Candidate phone number is required"],
      trim: true,
    },
    roleApplied: {
      type: String,
      required: [true, "Role applied is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["Applied", "Screening", "Interview", "Selected", "Rejected"],
      default: "Applied",
    },
    experience: {
      type: String,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: "",
    },
    // New ATS Profile fields
    currentCompany: {
      type: String,
      default: "",
    },
    currentLocation: {
      type: String,
      default: "",
    },
    noticePeriod: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      default: "",
    },
    linkedinUrl: {
      type: String,
      default: "",
    },
    resumeUrl: {
      type: String,
      default: "",
    },
    expectedSalary: {
      type: String,
      default: "",
    },
    lastContactedDate: {
      type: Date,
    },
    // Interview scheduling fields
    interviewDate: {
      type: Date,
    },
    interviewTime: {
      type: String,
      default: "",
    },
    interviewMode: {
      type: String,
      enum: ["", "Online", "Offline", "Phone"],
      default: "",
    },
    interviewerName: {
      type: String,
      default: "",
    },
    interviewRound: {
      type: String,
      default: "",
    },
    interviewStatus: {
      type: String,
      enum: ["", "Scheduled", "Completed", "Cancelled", "Rescheduled"],
      default: "",
    },
    interviewFeedback: {
      type: String,
      default: "",
    },
    // Archive support
    isArchived: {
      type: Boolean,
      default: false,
    },
    // Recruiter Activity Logs
    notesHistory: {
      type: [noteEntrySchema],
      default: [],
    },
    resumeFileName: {
      type: String,
      default: "",
    },
    resumePath: {
      type: String,
      default: "",
    },
    resumeUploadedAt: {
      type: Date,
    },
    activityTimeline: {
      type: [
        {
          type: {
            type: String,
            required: true,
          },
          message: {
            type: String,
            required: true,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    interviewerFeedback: {
      type: String,
      default: "",
    },
    interviewDecision: {
      type: String,
      enum: ["", "Move Forward", "Hold", "Reject", "Selected"],
      default: "",
    },
    candidateRating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;
