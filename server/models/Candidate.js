import mongoose from "mongoose";

const noteEntrySchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    default: "Recruiter",
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

const interviewSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  type: {
    type: String, // Online, Offline, Phone, etc.
    default: "Online",
  },
  interviewer: {
    type: String,
    default: "",
  },
  link: {
    type: String,
    default: "",
  },
  notes: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["Scheduled", "Completed", "Cancelled", "Rescheduled"],
    default: "Scheduled",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const candidateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    assignedRecruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedInterviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
      enum: ["Applied", "Screening", "Shortlisted", "Interview", "Selected", "Rejected"],
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
    // New file management fields
    coverLetterUrl: {
      type: String,
      default: "",
    },
    certificates: {
      type: [
        {
          name: { type: String, required: true },
          url: { type: String, required: true },
          uploadedAt: { type: Date, default: Date.now }
        }
      ],
      default: [],
    },
    // ATS Profile fields
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
    // Interview scheduling fields (compatibility with old schema)
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
    // Interview History Array
    interviews: {
      type: [interviewSchema],
      default: [],
    },
    // AI Candidates Summary Details
    aiSummary: {
      yearsOfExperience: { type: Number, default: 0 },
      primarySkills: { type: [String], default: [] },
      education: { type: String, default: "" },
      careerHighlights: { type: [String], default: [] },
      suitableRoles: { type: [String], default: [] },
      textSummary: { type: String, default: "" }
    },
    // AI Job match statistics
    matchScore: {
      type: Number,
      default: 0,
    },
    matchingSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    strengths: {
      type: [String],
      default: [],
    },
    suggestions: {
      type: [String],
      default: [],
    },
    aiRecommendation: {
      level: {
        type: String,
        enum: ["Strongly Recommended", "Recommended", "Consider", "Not Recommended", ""],
        default: "",
      },
      explanation: { type: String, default: "" }
    },
    // AI Questions List
    aiInterviewQuestions: {
      technical: { type: [String], default: [] },
      hr: { type: [String], default: [] },
      scenario: { type: [String], default: [] },
      coding: { type: [String], default: [] }
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
          performedBy: {
            type: String,
            default: "System",
          },
          performedById: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
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
    emailHistory: [
      {
        recipient: { type: String, required: true },
        subject: { type: String, required: true },
        body: { type: String },
        sentAt: { type: Date, default: Date.now },
        recruiter: { type: String },
        recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { type: String, enum: ["Success", "Failed"], default: "Success" },
        attachments: [{ type: String }]
      }
    ],
  },
  {
    timestamps: true,
  }
);

// DB indexing configuration for search performance
candidateSchema.index({ fullName: "text", email: "text", roleApplied: "text" });
candidateSchema.index({ jobId: 1 });
candidateSchema.index({ userId: 1 });
candidateSchema.index({ status: 1 });
candidateSchema.index({ matchScore: -1 });

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;
