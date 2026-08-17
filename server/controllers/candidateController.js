import Candidate from "../models/Candidate.js";
import Scorecard from "../models/Scorecard.js";
import Job from "../models/Job.js";
import fs from "fs";
import path from "path";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { uploadBufferToCloudinary } from "../utils/cloudinary.js";
import { parsePdfBuffer } from "../utils/pdfParser.js";
import { parseResumeAndSummarize, matchCandidateToJob, generateQuestionsForCandidate } from "../utils/aiService.js";
import {
  sendCandidateAddedEmail,
  sendInterviewScheduledEmail,
  sendCandidateSelectedEmail,
  sendCandidateRejectedEmail,
} from "../utils/emailService.js";
import { anonymizeCandidate, anonymizeText } from "../services/anonymizerService.js";
import { analyzeAndPersistCandidateMatch, computeCandidateJobMatch, generateAndPersistInterviewKit } from "../services/aiIntelligenceService.js";



const safeParse = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  return fallback;
};

// Helper to check user permission for candidate view/edit based on RBAC roles
const verifyAccess = async (req, candidate) => {
  // Admins and HR have access to all candidates
  if (req.user.role === "Admin" || req.user.role === "HR") return true;
  // Recruiters have access if they created candidate OR if candidate belongs to a job assigned to recruiter OR if assignedRecruiterId matches
  if (req.user.role === "Recruiter") {
    if (String(candidate.userId) === String(req.user._id)) return true;
    if (candidate.assignedRecruiterId && String(candidate.assignedRecruiterId) === String(req.user._id)) return true;
    if (candidate.jobId) {
      const job = await Job.findById(candidate.jobId);
      if (job && String(job.assignedRecruiterId) === String(req.user._id)) {
        return true;
      }
    }
  }
  // Interviewers only have access to view details if they are the interviewer
  if (req.user.role === "Interviewer") {
    if (candidate.assignedInterviewerId && String(candidate.assignedInterviewerId) === String(req.user._id)) return true;
    const nameRegex = new RegExp(`^${req.user.name}$`, "i");
    const matchesTopLevel = candidate.interviewerName && nameRegex.test(candidate.interviewerName);
    const matchesList = candidate.interviews && candidate.interviews.some(int => int.interviewer && nameRegex.test(int.interviewer));
    return matchesTopLevel || matchesList;
  }
  return false;
};

// Helper: Create a system notification alert
const createSystemNotification = async (userId, title, message, type = "Alert") => {
  try {
    await Notification.create({
      userId,
      title,
      message,
      type,
    });
  } catch (error) {
    console.error("Failed to create system notification:", error.message);
  }
};

// @desc    Parse PDF resume buffer, execute Groq parsing, compile Professional AI summary
// @route   POST /api/candidates/parse
// @access  Private (Admin, HR, Recruiter)
export const parseCandidateResume = async (req, res) => {
  try {
    if (!req.file) {
      console.log("[Resume Parse Failure] No PDF resume file attached");
      return res.status(400).json({ message: "No PDF resume file attached" });
    }

    console.log(`[Resume Parse Status] Starting PDF extraction for file: ${req.file.originalname}`);
    let textContent;
    try {
      textContent = await parsePdfBuffer(req.file.buffer);
    } catch (pdfError) {
      console.error("[Resume Parse Failure] PDF extraction failed:", pdfError.message);
      return res.status(400).json({ message: "Failed to parse PDF resume: " + pdfError.message });
    }

    if (!textContent || !textContent.trim()) {
      console.log("[Resume Parse Failure] PDF text extraction yielded empty content");
      return res.status(400).json({ message: "Unable to extract readable text content from the PDF resume" });
    }

    console.log("[Resume Parse Status] PDF text extracted successfully. Character count:", textContent.length);

    console.log("[Resume Parse Status] Sending prompt request to Groq AI...");
    let aiParsedResult;
    try {
      aiParsedResult = await parseResumeAndSummarize(textContent);
    } catch (groqError) {
      console.error("[Resume Parse Failure] Groq request or JSON parsing failed:", groqError.message);
      return res.status(500).json({ message: groqError.message || "Failed to parse resume using Groq AI" });
    }

    console.log("[Resume Parse Status] Groq AI completed parsing successfully. Candidate:", aiParsedResult?.fullName);

    res.json({
      message: "Resume parsed successfully using Groq AI",
      parsedData: aiParsedResult,
      rawTextLength: textContent.length
    });
  } catch (error) {
    console.error("[Resume Parse Failure] Server error during AI resume parsing:", error.message);
    res.status(500).json({ message: error.message || "Server error during AI resume parsing" });
  }
};

// @desc    Generate AI Interview questions based on candidate profile and job requirements
// @route   POST /api/candidates/:id/generate-questions
// @access  Private (Admin, HR, Recruiter)
export const generateAIQuestions = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    if (!(await verifyAccess(req, candidate))) {
      return res.status(403).json({ message: "Access forbidden" });
    }

    // Get Job Details
    let jobDetails = { title: candidate.roleApplied, description: "", requiredSkills: candidate.skills, experience: candidate.experience };
    if (candidate.jobId) {
      const jobDoc = await Job.findById(candidate.jobId);
      if (jobDoc) {
        jobDetails = jobDoc;
      }
    }

    // Combine skills and summaries as text input
    const candidateProfileText = `
      Name: ${candidate.fullName}
      Experience: ${candidate.experience}
      Skills: ${candidate.skills.join(", ")}
      AI Professional Summary: ${candidate.aiSummary?.textSummary || candidate.notes || "None provided"}
    `;

    const aiQuestions = await generateQuestionsForCandidate(candidateProfileText, jobDetails);

    candidate.aiInterviewQuestions = aiQuestions;
    
    // Log activity
    candidate.activityTimeline.push({
      type: "ai_questions_generated",
      message: "AI interview questions generated based on job profile and candidate skills",
      performedBy: req.user.name,
      performedById: req.user._id,
      createdAt: new Date(),
    });

    await candidate.save();

    res.json({
      message: "Interview questions generated successfully using Groq AI",
      aiInterviewQuestions: aiQuestions
    });
  } catch (error) {
    console.error("Generate AI Questions Error:", error.message);
    res.status(500).json({ message: "Server error while generating interview questions" });
  }
};

// @desc    Create a new candidate profile
// @route   POST /api/candidates
// @access  Private (Admin, HR, Recruiter)
export const createCandidate = async (req, res) => {
  try {
    const {
      fullName, email, phone, roleApplied, status, experience, skills, notes,
      currentCompany, currentLocation, noticePeriod, source, linkedinUrl,
      expectedSalary, lastContactedDate, interviewDate, interviewTime, interviewMode,
      interviewerName, interviewRound, interviewStatus, interviewFeedback,
      interviewerFeedback, interviewDecision, candidateRating, jobId,
      // Parsed AI fields (if prefilled by frontend)
      aiSummary, aiRecommendation, matchScore, matchingSkills, missingSkills, strengths, suggestions
    } = req.body;

    if (!fullName || !email || !phone || !roleApplied) {
      return res.status(400).json({ message: "Required fields: fullName, email, phone, and roleApplied" });
    }

    let processedSkills = skills;
    if (typeof skills === "string") {
      processedSkills = skills.split(",").map(skill => skill.trim()).filter(Boolean);
    }

    // Process files from Multer memory buffers and upload to Cloudinary
    let resumeUrl = "";
    let resumeFileName = "";
    let coverLetterUrl = "";
    const certificates = [];

    if (req.files) {
      if (req.files.resume && req.files.resume[0]) {
        const file = req.files.resume[0];
        resumeUrl = await uploadBufferToCloudinary(file.buffer, file.originalname, "resumes");
        resumeFileName = file.originalname;
      }
      if (req.files.coverLetter && req.files.coverLetter[0]) {
        const file = req.files.coverLetter[0];
        coverLetterUrl = await uploadBufferToCloudinary(file.buffer, file.originalname, "cover_letters");
      }
      if (req.files.certificates) {
        for (const file of req.files.certificates) {
          const url = await uploadBufferToCloudinary(file.buffer, file.originalname, "certificates");
          certificates.push({ name: file.originalname, url });
        }
      }
    }

    // Setup basic candidate structure
    const candidateData = {
      userId: req.user._id,
      fullName,
      email,
      phone,
      roleApplied,
      status: status || "Applied",
      experience: experience || "",
      skills: processedSkills || [],
      notes: notes || "",
      currentCompany: currentCompany || "",
      currentLocation: currentLocation || "",
      noticePeriod: noticePeriod || "",
      source: source || "",
      linkedinUrl: linkedinUrl || "",
      resumeUrl: resumeUrl || req.body.resumeUrl || "",
      resumeFileName: resumeFileName || req.body.resumeFileName || "",
      resumePath: resumeUrl || "",
      resumeUploadedAt: resumeUrl ? new Date() : undefined,
      coverLetterUrl: coverLetterUrl || req.body.coverLetterUrl || "",
      certificates: certificates.length > 0 ? certificates : safeParse(req.body.certificates, []),
      expectedSalary: expectedSalary || "",
      lastContactedDate: lastContactedDate || null,
      jobId: jobId || null,
      interviewDate: interviewDate || null,
      interviewTime: interviewTime || "",
      interviewMode: interviewMode || "",
      interviewerName: interviewerName || "",
      interviewRound: interviewRound || "",
      interviewStatus: interviewStatus || (interviewDate ? "Scheduled" : ""),
      interviewFeedback: interviewFeedback || "",
      interviewerFeedback: interviewerFeedback || "",
      interviewDecision: interviewDecision || "",
      candidateRating: candidateRating !== undefined ? Number(candidateRating) : undefined,
      isArchived: false,
      notesHistory: [],
      activityTimeline: [
        {
          type: "candidate_created",
          message: "Candidate profile created",
          performedBy: req.user.name,
          performedById: req.user._id,
          createdAt: new Date(),
        },
      ],
    };

    // Sync selected Job assignments
    if (jobId && mongoose.Types.ObjectId.isValid(jobId)) {
      const job = await Job.findById(jobId);
      if (job) {
        candidateData.jobId = job._id;
        candidateData.assignedRecruiterId = job.assignedRecruiterId || null;
        candidateData.assignedInterviewerId = job.assignedInterviewerId || null;
        candidateData.roleApplied = job.title;

        // Auto set interviewerName if empty
        if (!candidateData.interviewerName && job.assignedInterviewerId) {
          const interviewerUser = await User.findById(job.assignedInterviewerId);
          if (interviewerUser) {
            candidateData.interviewerName = interviewerUser.name;
          }
        }
      }
    }

    // If files are uploaded, log to timeline
    if (resumeUrl) {
      candidateData.activityTimeline.push({
        type: "resume_uploaded",
        message: `Resume uploaded: ${resumeFileName}`,
        performedBy: req.user.name,
        performedById: req.user._id,
        createdAt: new Date(),
      });
    }

    // Attach parsed AI objects if provided by client pre-filling
    if (aiSummary) candidateData.aiSummary = safeParse(aiSummary, {});
    if (aiRecommendation) candidateData.aiRecommendation = safeParse(aiRecommendation, {});
    if (matchScore !== undefined) candidateData.matchScore = Number(matchScore);
    if (matchingSkills) candidateData.matchingSkills = safeParse(matchingSkills, []);
    if (missingSkills) candidateData.missingSkills = safeParse(missingSkills, []);
    if (strengths) candidateData.strengths = safeParse(strengths, []);
    if (suggestions) candidateData.suggestions = safeParse(suggestions, []);

    // Calculate match score dynamically if not pre-populated and jobId is provided
    if (!candidateData.matchScore && candidateData.jobId) {
      const job = await Job.findById(candidateData.jobId);
      if (job) {
        try {
          const profileText = `Skills: ${candidateData.skills.join(", ")}; Experience: ${candidateData.experience}`;
          const comparison = await matchCandidateToJob(profileText, job);
          candidateData.matchScore = comparison.matchScore;
          candidateData.matchingSkills = comparison.matchingSkills;
          candidateData.missingSkills = comparison.missingSkills;
          candidateData.strengths = comparison.strengths;
          candidateData.suggestions = comparison.suggestions;
          candidateData.aiRecommendation = comparison.aiRecommendation;
        } catch (aiErr) {
          console.warn("Dynamic JD matching failed on create:", aiErr.message);
        }
      }
    }

    // Verify local file exists if local upload path is specified
    if (candidateData.resumeUrl && candidateData.resumeUrl.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), candidateData.resumeUrl);
      if (!fs.existsSync(filePath)) {
        return res.status(400).json({ message: `Resume file not found on server disk: ${candidateData.resumeUrl}` });
      }
    }

    const candidate = await Candidate.create(candidateData);

    // Send email alert (Candidate Added) in background
    sendCandidateAddedEmail(candidate);

    // Notify all Admins / HR users about the new application
    const notifiedUsers = await User.find({ role: { $in: ["Admin", "HR"] } });
    for (const adminUser of notifiedUsers) {
      createSystemNotification(
        adminUser._id,
        "New Candidate Application",
        `${candidate.fullName} applied for ${candidate.roleApplied}`,
        "Application"
      );
    }

    res.status(201).json(candidate);
  } catch (error) {
    console.error("========== CREATE CANDIDATE ERROR ==========");
    console.error(error);
    console.error(error.stack);
    console.error("Request Body:");
    console.dir(req.body, { depth: null });
    console.error("===========================================");
    res.status(500).json({ message: "Server error while creating candidate profile" });
  }
};

// @desc    Get candidates with sorting, paginated indexes, and search parameters
// @route   GET /api/candidates
// @access  Private
export const getCandidates = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const source = req.query.source || "";
    const jobId = req.query.jobId || "";
    const minMatchScore = parseInt(req.query.minMatchScore) || 0;
    const sort = req.query.sort || "newest";

    const query = {};

    // 1. CastError and ObjectId Validation for jobId
    if (jobId) {
      if (jobId === "null" || jobId === "undefined" || jobId === "") {
        query.jobId = null;
      } else if (mongoose.Types.ObjectId.isValid(jobId)) {
        query.jobId = new mongoose.Types.ObjectId(jobId);
      } else {
        // Prevent CastError by using a dummy ObjectId
        query.jobId = new mongoose.Types.ObjectId();
      }
    }

    // 2. Validate query params for assignedRecruiterId & assignedInterviewerId
    if (req.query.assignedRecruiterId !== undefined) {
      const recId = req.query.assignedRecruiterId;
      if (recId === "null" || recId === "undefined" || recId === "" || !mongoose.Types.ObjectId.isValid(recId)) {
        return res.json({ candidates: [], page: 1, pages: 1, limit, total: 0 });
      }
      query.assignedRecruiterId = new mongoose.Types.ObjectId(recId);
    }

    if (req.query.assignedInterviewerId !== undefined) {
      const intId = req.query.assignedInterviewerId;
      if (intId === "null" || intId === "undefined" || intId === "" || !mongoose.Types.ObjectId.isValid(intId)) {
        return res.json({ candidates: [], page: 1, pages: 1, limit, total: 0 });
      }
      query.assignedInterviewerId = new mongoose.Types.ObjectId(intId);
    }

    // 3. RBAC checks for Candidate list
    if (req.user.role === "Recruiter") {
      const recruiterId = req.user._id;
      if (!recruiterId || !mongoose.Types.ObjectId.isValid(recruiterId)) {
        return res.json({ candidates: [], page: 1, pages: 1, limit, total: 0 });
      }

      const assignedJobs = await Job.find({ assignedRecruiterId: recruiterId });
      const assignedJobIds = assignedJobs.map(j => j._id);

      query.$or = [
        { userId: recruiterId },
        { assignedRecruiterId: recruiterId },
        { jobId: { $in: assignedJobIds } }
      ];
    } else if (req.user.role === "Interviewer") {
      const interviewerId = req.user._id;
      if (!interviewerId || !mongoose.Types.ObjectId.isValid(interviewerId)) {
        return res.json({ candidates: [], page: 1, pages: 1, limit, total: 0 });
      }

      const nameRegex = new RegExp(`^${req.user.name}$`, "i");
      query.$or = [
        { assignedInterviewerId: interviewerId },
        { interviewerName: { $regex: nameRegex } },
        { "interviews.interviewer": { $regex: nameRegex } }
      ];
    }

    // Apply Archived filters
    if (req.query.archived === "true") {
      query.isArchived = true;
    } else if (req.query.archived === "all") {
      // Do nothing, returns both
    } else {
      query.isArchived = false;
    }

    // Apply Filters
    if (status) query.status = status;
    if (source) query.source = source;
    if (minMatchScore > 0) query.matchScore = { $gte: minMatchScore };

    // Apply Text / Regex Search
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { roleApplied: { $regex: search, $options: "i" } },
          { skills: { $in: [new RegExp(search, "i")] } }
        ]
      });
    }

    // Sorting definition
    let sortConfig = { createdAt: -1 };
    if (sort === "newest") sortConfig = { createdAt: -1 };
    else if (sort === "oldest") sortConfig = { createdAt: 1 };
    else if (sort === "matchScore") sortConfig = { matchScore: -1, createdAt: -1 };
    else if (sort === "name") sortConfig = { fullName: 1 };

    // Pagination calculations
    const skip = (page - 1) * limit;
    const total = await Candidate.countDocuments(query);
    const pages = Math.ceil(total / limit);

    const candidates = await Candidate.find(query)
      .populate("jobId", "title department")
      .populate("userId", "name email")
      .sort(sortConfig)
      .skip(skip)
      .limit(limit);

    res.json({
      candidates,
      page,
      pages,
      limit,
      total,
    });
  } catch (error) {
    console.error("Get Candidates Error:", error.message);
    res.status(500).json({ message: "Server error while fetching candidates" });
  }
};

// @desc    Get candidate by ID
// @route   GET /api/candidates/:id
// @access  Private
export const getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate("jobId", "title department description requiredSkills experience")
      .populate("userId", "name email")
      .populate("notesHistory.authorId", "name role");

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    if (!(await verifyAccess(req, candidate))) {
      return res.status(403).json({ message: "Not authorized to view this candidate" });
    }

    res.json(candidate);
  } catch (error) {
    console.error("Get Candidate By ID Error:", error.message);
    res.status(500).json({ message: "Server error while fetching candidate profile" });
  }
};

// @desc    Update candidate profile (including file uploads and JD recalculations)
// @route   PUT /api/candidates/:id
// @access  Private
export const updateCandidate = async (req, res) => {
  try {
    let candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // FLOW 2: Interviewer Flow
    if (req.user.role === "Interviewer") {
      if (!(await verifyAccess(req, candidate))) {
        return res.status(403).json({ message: "Not authorized to modify this candidate" });
      }

      // Check if they tried to change any forbidden fields
      const forbiddenFields = [
        "fullName", "email", "phone", "skills", "experience", "resumeUrl", "resumeFileName", "resumePath",
        "expectedSalary", "currentCompany", "currentLocation", "noticePeriod", "notes", "jobId",
        "assignedRecruiterId", "assignedInterviewerId", "roleApplied", "status", "matchScore",
        "aiSummary", "aiRecommendation", "matchingSkills", "missingSkills", "strengths", "suggestions"
      ];
      for (const key of forbiddenFields) {
        if (req.body[key] !== undefined) {
          const bodyVal = typeof req.body[key] === "object" && req.body[key] !== null ? String(req.body[key]._id || req.body[key].id || "") : String(req.body[key]);
          const docVal = typeof candidate[key] === "object" && candidate[key] !== null ? String(candidate[key]._id || candidate[key].id || "") : String(candidate[key] || "");
          if (bodyVal !== docVal) {
            return res.status(403).json({ message: "Not authorized to modify profile fields" });
          }
        }
      }

      // Update ONLY allowed fields
      candidate.interviewerFeedback = req.body.interviewerFeedback !== undefined ? req.body.interviewerFeedback : candidate.interviewerFeedback;
      candidate.interviewFeedback = req.body.interviewFeedback !== undefined ? req.body.interviewFeedback : candidate.interviewFeedback;
      candidate.interviewDecision = req.body.interviewDecision !== undefined ? req.body.interviewDecision : candidate.interviewDecision;
      candidate.interviewStatus = req.body.interviewStatus !== undefined ? req.body.interviewStatus : candidate.interviewStatus;
      candidate.candidateRating = req.body.candidateRating !== undefined ? Number(req.body.candidateRating) : candidate.candidateRating;

      // Append to timeline
      candidate.activityTimeline.push({
        type: "interview_completed",
        message: "Interview feedback submitted",
        performedBy: req.user.name,
        performedById: req.user._id,
        createdAt: new Date(),
      });

      await candidate.save();
      return res.status(200).json({
        message: "Interview feedback saved successfully",
        candidate
      });
    }

    // FLOW 1: Admin / HR / Recruiter Flow
    if (!(await verifyAccess(req, candidate))) {
      return res.status(403).json({ message: "Not authorized to modify this candidate" });
    }

    const {
      fullName, email, phone, roleApplied, status, experience, skills, notes,
      currentCompany, currentLocation, noticePeriod, source, linkedinUrl,
      expectedSalary, lastContactedDate, interviewDate, interviewTime, interviewMode,
      interviewerName, interviewRound, interviewStatus, interviewFeedback,
      interviewerFeedback, interviewDecision, candidateRating, jobId,
      aiSummary, aiRecommendation, matchScore, matchingSkills, missingSkills, strengths, suggestions
    } = req.body;

    let processedSkills = skills;
    if (typeof skills === "string") {
      processedSkills = skills.split(",").map(skill => skill.trim()).filter(Boolean);
    }

    // Process new uploaded files
    let resumeUrl = candidate.resumeUrl;
    let resumeFileName = candidate.resumeFileName;
    let coverLetterUrl = candidate.coverLetterUrl;
    const certificates = [...candidate.certificates];

    if (req.files) {
      if (req.files.resume && req.files.resume[0]) {
        const file = req.files.resume[0];
        resumeUrl = await uploadBufferToCloudinary(file.buffer, file.originalname, "resumes");
        resumeFileName = file.originalname;
        candidate.activityTimeline.push({
          type: "resume_uploaded",
          message: `Updated resume file uploaded: ${resumeFileName}`,
          performedBy: req.user.name,
          performedById: req.user._id,
          createdAt: new Date(),
        });
      }
      if (req.files.coverLetter && req.files.coverLetter[0]) {
        const file = req.files.coverLetter[0];
        coverLetterUrl = await uploadBufferToCloudinary(file.buffer, file.originalname, "cover_letters");
        candidate.activityTimeline.push({
          type: "cover_letter_uploaded",
          message: `Cover letter uploaded: ${file.originalname}`,
          performedBy: req.user.name,
          performedById: req.user._id,
          createdAt: new Date(),
        });
      }
      if (req.files.certificates) {
        for (const file of req.files.certificates) {
          const url = await uploadBufferToCloudinary(file.buffer, file.originalname, "certificates");
          certificates.push({ name: file.originalname, url });
        }
        candidate.activityTimeline.push({
          type: "certificates_uploaded",
          message: `New certificate attachments uploaded`,
          performedBy: req.user.name,
          performedById: req.user._id,
          createdAt: new Date(),
        });
      }
    }

    // Check for status changes
    if (status && status !== candidate.status) {
      candidate.activityTimeline.push({
        type: "status_change",
        message: `Status changed from ${candidate.status} to ${status}`,
        performedBy: req.user.name,
        performedById: req.user._id,
        createdAt: new Date(),
      });

      // Transactional Outreach Alerts
      if (status === "Selected") {
        sendCandidateSelectedEmail(candidate);
        createSystemNotification(candidate.userId, "Candidate Selected", `${candidate.fullName} has been selected!`, "Alert");
      } else if (status === "Rejected") {
        sendCandidateRejectedEmail(candidate);
      }
    }

    // Check for interview changes
    if (interviewDate && String(interviewDate) !== String(candidate.interviewDate)) {
      candidate.activityTimeline.push({
        type: "interview_scheduled",
        message: `Interview scheduled/rescheduled for: ${new Date(interviewDate).toLocaleDateString()}`,
        performedBy: req.user.name,
        performedById: req.user._id,
        createdAt: new Date(),
      });

      // Save into interviews history list
      candidate.interviews.push({
        date: interviewDate,
        time: interviewTime || "Not Set",
        type: interviewMode || "Online",
        interviewer: interviewerName || "TBD",
        notes: interviewRound || "General Round",
        status: "Scheduled",
      });

      // Send Interview Email Notification in background
      sendInterviewScheduledEmail(
        candidate,
        new Date(interviewDate).toLocaleDateString(),
        interviewTime || "Not Set",
        interviewMode || "Online",
        "" // No meeting link initially
      );

      createSystemNotification(
        candidate.userId,
        "Interview Scheduled",
        `Interview scheduled with ${candidate.fullName} on ${new Date(interviewDate).toLocaleDateString()}`,
        "Interview"
      );
    }

    // Apply general updates
    candidate.fullName = fullName !== undefined ? fullName : candidate.fullName;
    candidate.email = email !== undefined ? email : candidate.email;
    candidate.phone = phone !== undefined ? phone : candidate.phone;
    candidate.roleApplied = roleApplied !== undefined ? roleApplied : candidate.roleApplied;
    candidate.status = status !== undefined ? status : candidate.status;
    candidate.experience = experience !== undefined ? experience : candidate.experience;
    candidate.skills = processedSkills !== undefined ? processedSkills : candidate.skills;
    candidate.notes = notes !== undefined ? notes : candidate.notes;
    candidate.currentCompany = currentCompany !== undefined ? currentCompany : candidate.currentCompany;
    candidate.currentLocation = currentLocation !== undefined ? currentLocation : candidate.currentLocation;
    candidate.noticePeriod = noticePeriod !== undefined ? noticePeriod : candidate.noticePeriod;
    candidate.source = source !== undefined ? source : candidate.source;
    candidate.linkedinUrl = linkedinUrl !== undefined ? linkedinUrl : candidate.linkedinUrl;
    candidate.expectedSalary = expectedSalary !== undefined ? expectedSalary : candidate.expectedSalary;
    candidate.lastContactedDate = lastContactedDate !== undefined ? lastContactedDate : candidate.lastContactedDate;
    
    // Files URLs
    candidate.resumeUrl = resumeUrl;
    candidate.resumeFileName = resumeFileName;
    candidate.resumePath = resumeUrl || candidate.resumePath || "";
    if (resumeUrl && resumeUrl !== candidate.resumeUrl) {
      candidate.resumeUploadedAt = new Date();
    } else if (!candidate.resumeUploadedAt && candidate.resumeUrl) {
      candidate.resumeUploadedAt = new Date();
    }
    candidate.coverLetterUrl = coverLetterUrl;
    candidate.certificates = certificates;

    // Check if Job reference updated and sync assignments
    const isJobChanged = jobId !== undefined && String(jobId) !== String(candidate.jobId);
    candidate.jobId = jobId !== undefined ? (jobId || null) : candidate.jobId;

    if (jobId && mongoose.Types.ObjectId.isValid(jobId)) {
      const job = await Job.findById(jobId);
      if (job) {
        candidate.assignedRecruiterId = job.assignedRecruiterId || null;
        candidate.assignedInterviewerId = job.assignedInterviewerId || null;
        candidate.roleApplied = job.title;

        // Auto set interviewerName if empty
        if (!candidate.interviewerName && job.assignedInterviewerId) {
          const interviewerUser = await User.findById(job.assignedInterviewerId);
          if (interviewerUser) {
            candidate.interviewerName = interviewerUser.name;
          }
        }
      }
    } else if (jobId === null || jobId === "") {
      candidate.assignedRecruiterId = null;
      candidate.assignedInterviewerId = null;
    }

    // Support direct updates for assignedInterviewerId
    if (req.body.assignedInterviewerId !== undefined) {
      candidate.assignedInterviewerId = req.body.assignedInterviewerId || null;
      if (candidate.assignedInterviewerId && (!candidate.interviewerName || candidate.interviewerName === "")) {
        const interviewerUser = await User.findById(candidate.assignedInterviewerId);
        if (interviewerUser) {
          candidate.interviewerName = interviewerUser.name;
        }
      }
    }

    // Prefilled values
    if (aiSummary) candidate.aiSummary = safeParse(aiSummary, {});
    if (aiRecommendation) candidate.aiRecommendation = safeParse(aiRecommendation, {});
    if (matchScore !== undefined) candidate.matchScore = Number(matchScore);
    if (matchingSkills) candidate.matchingSkills = safeParse(matchingSkills, []);
    if (missingSkills) candidate.missingSkills = safeParse(missingSkills, []);
    if (strengths) candidate.strengths = safeParse(strengths, []);
    if (suggestions) candidate.suggestions = safeParse(suggestions, []);

    // Calculate match score dynamically if Job changed or newly attached
    if (candidate.jobId && (isJobChanged || req.files?.resume)) {
      const job = await Job.findById(candidate.jobId);
      if (job) {
        try {
          const profileText = `Skills: ${candidate.skills.join(", ")}; Experience: ${candidate.experience}`;
          const comparison = await matchCandidateToJob(profileText, job);
          candidate.matchScore = comparison.matchScore;
          candidate.matchingSkills = comparison.matchingSkills;
          candidate.missingSkills = comparison.missingSkills;
          candidate.strengths = comparison.strengths;
          candidate.suggestions = comparison.suggestions;
          candidate.aiRecommendation = comparison.aiRecommendation;
        } catch (aiErr) {
          console.warn("Dynamic matching failed on update:", aiErr.message);
        }
      }
    }

    // Preserve compat variables
    candidate.interviewDate = interviewDate !== undefined ? (interviewDate || null) : candidate.interviewDate;
    candidate.interviewTime = interviewTime !== undefined ? interviewTime : candidate.interviewTime;
    candidate.interviewMode = interviewMode !== undefined ? interviewMode : candidate.interviewMode;
    candidate.interviewerName = interviewerName !== undefined ? interviewerName : candidate.interviewerName;
    candidate.interviewRound = interviewRound !== undefined ? interviewRound : candidate.interviewRound;
    candidate.interviewStatus = interviewStatus !== undefined ? interviewStatus : candidate.interviewStatus;
    candidate.interviewFeedback = interviewFeedback !== undefined ? interviewFeedback : candidate.interviewFeedback;
    candidate.interviewerFeedback = interviewerFeedback !== undefined ? interviewerFeedback : candidate.interviewerFeedback;
    candidate.interviewDecision = interviewDecision !== undefined ? interviewDecision : candidate.interviewDecision;
    candidate.candidateRating = candidateRating !== undefined ? (candidateRating !== "" ? Number(candidateRating) : undefined) : candidate.candidateRating;

    // Verify local file exists if local upload path is specified
    if (candidate.resumeUrl && candidate.resumeUrl.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), candidate.resumeUrl);

    if (!fs.existsSync(filePath)) {
        console.warn("Old resume file not found. Continuing update.");
        candidate.resumeUrl = "";
        candidate.resumeFileName = "";
        candidate.resumePath = "";
    }
}

    await candidate.save();
    res.json({ message: "Candidate profile updated successfully", candidate });
  } catch (error) {
    console.error("Update Candidate Error:", error.message);
    res.status(500).json({ message: "Server error while updating candidate profile" });
  }
};

// @desc    Delete a candidate profile
// @route   DELETE /api/candidates/:id
// @access  Private (Admin, HR)
export const deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    if (req.user.role !== "Admin" && req.user.role !== "HR") {
      return res.status(403).json({ message: "Access restricted to Admin/HR" });
    }

    await candidate.deleteOne();
    res.json({ message: "Candidate profile deleted successfully" });
  } catch (error) {
    console.error("Delete Candidate Error:", error.message);
    res.status(500).json({ message: "Server error while deleting candidate" });
  }
};

// @desc    Archive a candidate profile
// @route   PUT /api/candidates/:id/archive
// @access  Private
export const archiveCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    candidate.isArchived = true;
    candidate.activityTimeline.push({
      type: "candidate_archived",
      message: "Candidate profile archived",
      performedBy: req.user.name,
      performedById: req.user._id,
      createdAt: new Date(),
    });

    await candidate.save();
    res.json(candidate);
  } catch (error) {
    console.error("Archive Candidate Error:", error.message);
    res.status(500).json({ message: "Server error while archiving candidate" });
  }
};

// @desc    Restore an archived candidate profile
// @route   PUT /api/candidates/:id/restore
// @access  Private
export const restoreCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    candidate.isArchived = false;
    candidate.activityTimeline.push({
      type: "candidate_restored",
      message: "Candidate profile restored to active pipeline",
      performedBy: req.user.name,
      performedById: req.user._id,
      createdAt: new Date(),
    });

    await candidate.save();
    res.json(candidate);
  } catch (error) {
    console.error("Restore Candidate Error:", error.message);
    res.status(500).json({ message: "Server error while restoring candidate" });
  }
};

// @desc    Add Recruiter note to note history
// @route   POST /api/candidates/:id/notes
// @access  Private
export const addRecruiterNote = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Note text cannot be empty" });
    }

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    candidate.notesHistory.push({
      text,
      author: req.user.name,
      authorId: req.user._id,
      createdAt: new Date(),
    });

    candidate.activityTimeline.push({
      type: "note_added",
      message: `Recruiter note added by ${req.user.name}`,
      performedBy: req.user.name,
      performedById: req.user._id,
      createdAt: new Date(),
    });

    await candidate.save();
    res.status(201).json(candidate);
  } catch (error) {
    console.error("Add Recruiter Note Error:", error.message);
    res.status(500).json({ message: "Server error while adding note" });
  }
};

// @desc    Edit an existing note in history
// @route   PUT /api/candidates/:id/notes/:noteId
// @access  Private
export const editRecruiterNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Note text cannot be empty" });
    }

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const note = candidate.notesHistory.id(noteId);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Verify ownership
    if (String(note.authorId) !== String(req.user._id) && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to edit someone else's note" });
    }

    note.text = text;
    note.updatedAt = new Date();

    candidate.activityTimeline.push({
      type: "note_edited",
      message: `Recruiter note modified by ${req.user.name}`,
      performedBy: req.user.name,
      performedById: req.user._id,
      createdAt: new Date(),
    });

    await candidate.save();
    res.json(candidate);
  } catch (error) {
    console.error("Edit Note Error:", error.message);
    res.status(500).json({ message: "Server error while modifying note" });
  }
};

// @desc    Delete a note from history
// @route   DELETE /api/candidates/:id/notes/:noteId
// @access  Private
export const deleteRecruiterNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const note = candidate.notesHistory.id(noteId);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Verify ownership
    if (String(note.authorId) !== String(req.user._id) && req.user.role !== "Admin" && req.user.role !== "HR") {
      return res.status(403).json({ message: "Not authorized to delete this note" });
    }

    note.deleteOne();

    candidate.activityTimeline.push({
      type: "note_deleted",
      message: `Recruiter note removed`,
      performedBy: req.user.name,
      performedById: req.user._id,
      createdAt: new Date(),
    });

    await candidate.save();
    res.json(candidate);
  } catch (error) {
    console.error("Delete Note Error:", error.message);
    res.status(500).json({ message: "Server error while deleting note" });
  }
};

// @desc    Get candidate metrics stats
// @route   GET /api/candidates/stats
// @access  Private
export const getCandidateStats = async (req, res) => {
  try {
    const query = { isArchived: false };
    const emptyStats = { total: 0, Applied: 0, Screening: 0, Shortlisted: 0, Interview: 0, Selected: 0, Rejected: 0 };

    // 1. CastError and ObjectId Validation for jobId
    const jobId = req.query.jobId;
    if (jobId) {
      if (jobId === "null" || jobId === "undefined" || jobId === "") {
        query.jobId = null;
      } else if (mongoose.Types.ObjectId.isValid(jobId)) {
        query.jobId = new mongoose.Types.ObjectId(jobId);
      } else {
        query.jobId = new mongoose.Types.ObjectId();
      }
    }

    // 2. Validate query params for assignedRecruiterId & assignedInterviewerId
    if (req.query.assignedRecruiterId !== undefined) {
      const recId = req.query.assignedRecruiterId;
      if (recId === "null" || recId === "undefined" || recId === "" || !mongoose.Types.ObjectId.isValid(recId)) {
        return res.json(emptyStats);
      }
      query.assignedRecruiterId = new mongoose.Types.ObjectId(recId);
    }

    if (req.query.assignedInterviewerId !== undefined) {
      const intId = req.query.assignedInterviewerId;
      if (intId === "null" || intId === "undefined" || intId === "" || !mongoose.Types.ObjectId.isValid(intId)) {
        return res.json(emptyStats);
      }
      query.assignedInterviewerId = new mongoose.Types.ObjectId(intId);
    }

    // 3. RBAC: Recruiters aggregate stats for their own candidates or jobs, Interviewers for assigned candidates
    if (req.user.role === "Recruiter") {
      const recruiterId = req.user._id;
      if (!recruiterId || !mongoose.Types.ObjectId.isValid(recruiterId)) {
        return res.json(emptyStats);
      }

      const assignedJobs = await Job.find({ assignedRecruiterId: recruiterId });
      const assignedJobIds = assignedJobs.map(j => j._id);
      query.$or = [
        { userId: recruiterId },
        { assignedRecruiterId: recruiterId },
        { jobId: { $in: assignedJobIds } }
      ];
    } else if (req.user.role === "Interviewer") {
      const interviewerId = req.user._id;
      if (!interviewerId || !mongoose.Types.ObjectId.isValid(interviewerId)) {
        return res.json(emptyStats);
      }

      const nameRegex = new RegExp(`^${req.user.name}$`, "i");
      query.$or = [
        { assignedInterviewerId: interviewerId },
        { interviewerName: { $regex: nameRegex } },
        { "interviews.interviewer": { $regex: nameRegex } }
      ];
    }

    const total = await Candidate.countDocuments(query);
    const Applied = await Candidate.countDocuments({ ...query, status: "Applied" });
    const Screening = await Candidate.countDocuments({ ...query, status: "Screening" });
    const Shortlisted = await Candidate.countDocuments({ ...query, status: "Shortlisted" });
    const Interview = await Candidate.countDocuments({ ...query, status: "Interview" });
    const Selected = await Candidate.countDocuments({ ...query, status: "Selected" });
    const Rejected = await Candidate.countDocuments({ ...query, status: "Rejected" });

    res.json({
      total,
      Applied,
      Screening,
      Shortlisted,
      Interview,
      Selected,
      Rejected,
    });
  } catch (error) {
    console.error("Get Candidate Stats Error:", error.message);
    res.status(500).json({ message: "Server error while compiling statistics" });
  }
};

// @desc    Get comprehensive reports and visualizations data
// @route   GET /api/candidates/reports
// @access  Private
export const getCandidateReports = async (req, res) => {
  try {
    const query = { isArchived: false };

    // RBAC check: only Admin and HR can view reports
    if (req.user.role === "Recruiter" || req.user.role === "Interviewer") {
      return res.status(403).json({ message: "Access forbidden" });
    }

    // 1. Stage counts stats
    const stageStats = await Candidate.aggregate([
      { $match: query },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // 2. Source distribution stats
    const sourceStats = await Candidate.aggregate([
      { $match: query },
      { $group: { _id: "$source", count: { $sum: 1 } } }
    ]);

    // 3. Average Match Score calculation
    const candidatesWithMatch = await Candidate.find({ ...query, matchScore: { $gt: 0 } });
    let averageMatchScore = 0;
    if (candidatesWithMatch.length > 0) {
      const totalScore = candidatesWithMatch.reduce((acc, c) => acc + c.matchScore, 0);
      averageMatchScore = Math.round(totalScore / candidatesWithMatch.length);
    }

    // 4. Hiring Success Rate calculation
    const totalApplicants = await Candidate.countDocuments(query);
    const selectedApplicants = await Candidate.countDocuments({ ...query, status: "Selected" });
    const hiringSuccessRate = totalApplicants > 0 ? Math.round((selectedApplicants / totalApplicants) * 100) : 0;

    // 5. Monthly Application Trends
    const monthlyTrend = await Candidate.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // 6. Top skills analytics across candidates
    const skillsList = await Candidate.find(query).select("skills");
    const skillsCounts = {};
    skillsList.forEach(c => {
      if (c.skills) {
        c.skills.forEach(skill => {
          const cleanSkill = skill.trim();
          skillsCounts[cleanSkill] = (skillsCounts[cleanSkill] || 0) + 1;
        });
      }
    });

    const topSkills = Object.keys(skillsCounts)
      .map(name => ({ name, count: skillsCounts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 7. Job-wise candidate distribution
    const jobDistribution = await Candidate.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$jobId",
          count: { $sum: 1 }
        }
      }
    ]);

    // Populate Job names manually
    const jobWiseCandidates = [];
    for (const item of jobDistribution) {
      if (item._id) {
        const job = await Job.findById(item._id).select("title department");
        if (job) {
          jobWiseCandidates.push({
            jobTitle: job.title,
            department: job.department,
            count: item.count
          });
        }
      } else {
        jobWiseCandidates.push({
          jobTitle: "Unassigned Candidates",
          department: "None",
          count: item.count
        });
      }
    }

    // 8. Recruiter Performance Metrics
    const recruiters = await User.find({ role: { $in: ["Recruiter", "Admin", "HR"] } }).select("name email role");
    const recruiterPerformance = [];
    for (const rec of recruiters) {
      const candidatesCount = await Candidate.countDocuments({ userId: rec._id, isArchived: false });
      const hiredCount = await Candidate.countDocuments({ userId: rec._id, status: "Selected", isArchived: false });
      recruiterPerformance.push({
        name: rec.name,
        email: rec.email,
        role: rec.role,
        processed: candidatesCount,
        hired: hiredCount,
      });
    }

    // 9. Open vs Closed Jobs counts
    const activeJobsCount = await Job.countDocuments({ status: "Active" });
    const closedJobsCount = await Job.countDocuments({ status: "Closed" });
    const draftJobsCount = await Job.countDocuments({ status: "Draft" });

    // 10. Overall active/archived counts
    const activeCount = await Candidate.countDocuments({ isArchived: false });
    const archivedCount = await Candidate.countDocuments({ isArchived: true });

    res.json({
      activeCount,
      archivedCount,
      stageStats,
      sourceStats,
      averageMatchScore,
      hiringSuccessRate,
      monthlyTrend,
      topSkills,
      jobWiseCandidates,
      recruiterPerformance,
      jobsCount: {
        active: activeJobsCount,
        closed: closedJobsCount,
        draft: draftJobsCount
      }
    });
  } catch (error) {
    console.error("Get Reports Error:", error.message);
    res.status(500).json({ message: "Server error while aggregating metrics data" });
  }
};

// @desc    Legacy uploadResume endpoint fallback support
// @route   POST /api/candidates/:id/resume
// @access  Private
export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Upload to Cloudinary using RAM buffer
    const url = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname, "resumes");

    candidate.resumeFileName = req.file.originalname;
    candidate.resumePath = url;
    candidate.resumeUrl = url;
    candidate.resumeUploadedAt = new Date();

    candidate.activityTimeline.push({
      type: "resume_uploaded",
      message: `Resume file updated via legacy path: ${req.file.originalname}`,
      performedBy: req.user.name,
      performedById: req.user._id,
      createdAt: new Date(),
    });

    await candidate.save();
    res.json({ message: "Resume uploaded successfully", candidate });
  } catch (error) {
    console.error("Legacy Upload Resume Error:", error.message);
    res.status(500).json({ message: "Server error while uploading resume" });
  }
};

// @desc    Create scorecards (already exists)
// @route   POST /api/candidates/:id/scorecards
// @access  Private
export const createScorecard = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      communicationScore,
      technicalScore,
      problemSolvingScore,
      cultureFitScore,
      overallRecommendation,
      interviewerComments
    } = req.body;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const scorecard = await Scorecard.create({
      candidateId: id,
      userId: req.user._id,
      communicationScore: Number(communicationScore),
      technicalScore: Number(technicalScore),
      problemSolvingScore: Number(problemSolvingScore),
      cultureFitScore: Number(cultureFitScore),
      overallRecommendation,
      interviewerComments: interviewerComments || ""
    });

    candidate.candidateRating = Math.round((Number(communicationScore) + Number(technicalScore) + Number(problemSolvingScore) + Number(cultureFitScore)) / 4);
    candidate.interviewDecision = overallRecommendation === "Reject" ? "Reject" : overallRecommendation === "Hold" ? "Hold" : "Move Forward";
    candidate.interviewerFeedback = interviewerComments || "";
    candidate.interviewStatus = "Completed";

    candidate.activityTimeline.push({
      type: "scorecard_added",
      message: `Interviewer scorecard added with rating: ${candidate.candidateRating}/5`,
      performedBy: req.user.name,
      performedById: req.user._id,
      createdAt: new Date(),
    });

    await candidate.save();
    res.status(201).json({ scorecard, candidate });
  } catch (error) {
    console.error("Create Scorecard Error:", error.message);
    res.status(500).json({ message: "Server error while submitting scorecard" });
  }
};

// @desc    Get candidate scorecards
// @route   GET /api/candidates/:id/scorecards
// @access  Private
export const getCandidateScorecards = async (req, res) => {
  try {
    const scorecards = await Scorecard.find({ candidateId: req.params.id })
      .populate("userId", "name role")
      .sort({ createdAt: -1 });
    res.json(scorecards);
  } catch (error) {
    console.error("Get Scorecards Error:", error.message);
    res.status(500).json({ message: "Server error while fetching scorecards" });
  }
};

/* --- Bulk Candidate Action controllers --- */

// @desc    Bulk Delete selected candidates
// @route   POST /api/candidates/bulk-delete
// @access  Private (Admin, HR)
export const bulkDeleteCandidates = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Please provide an array of candidate IDs to delete" });
    }

    if (req.user.role !== "Admin" && req.user.role !== "HR") {
      return res.status(403).json({ message: "Bulk delete is restricted to Admin/HR roles" });
    }

    await Candidate.deleteMany({ _id: { $in: ids } });
    res.json({ message: `Successfully deleted ${ids.length} candidate profiles` });
  } catch (error) {
    console.error("Bulk Delete Error:", error.message);
    res.status(500).json({ message: "Server error during bulk delete" });
  }
};

// @desc    Bulk Update status for selected candidates
// @route   POST /api/candidates/bulk-status
// @access  Private (Admin, HR, Recruiter)
export const bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
      return res.status(400).json({ message: "Required fields: ids (array) and status" });
    }

    const permittedStages = ["Applied", "Screening", "Shortlisted", "Interview", "Selected", "Rejected"];
    if (!permittedStages.includes(status)) {
      return res.status(400).json({ message: "Invalid status value specified" });
    }

    // Find and update each candidate to trigger status hooks or timeline additions
    const candidates = await Candidate.find({ _id: { $in: ids } });
    for (const cand of candidates) {
      if (await verifyAccess(req, cand)) {
        const oldStatus = cand.status;
        cand.status = status;
        cand.activityTimeline.push({
          type: "status_change",
          message: `Status changed in bulk update from ${oldStatus} to ${status}`,
          performedBy: req.user.name,
          performedById: req.user._id,
          createdAt: new Date(),
        });
        await cand.save();

        // Transactional emails
        if (status === "Selected") sendCandidateSelectedEmail(cand);
        else if (status === "Rejected") sendCandidateRejectedEmail(cand);
      }
    }

    res.json({ message: `Successfully updated status to '${status}' for eligible candidates` });
  } catch (error) {
    console.error("Bulk Status Update Error:", error.message);
    res.status(500).json({ message: "Server error during bulk status update" });
  }
};

// @desc    Bulk Send template outreach emails
// @route   POST /api/candidates/bulk-email
// @access  Private
export const bulkEmailCandidates = async (req, res) => {
  try {
    const { ids, subject, body } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !subject || !body) {
      return res.status(400).json({ message: "Required fields: ids (array), subject, and body" });
    }

    const candidates = await Candidate.find({ _id: { $in: ids } });
    let count = 0;
    
    for (const cand of candidates) {
      if (await verifyAccess(req, cand)) {
        // Substitute basic placeholders
        let customizedBody = body
          .replace(/\{\{CandidateName\}\}/g, cand.fullName)
          .replace(/\{\{RoleApplied\}\}/g, cand.roleApplied)
          .replace(/\{\{RecruiterName\}\}/g, req.user.name);

        const emailSent = await sendCandidateRejectedEmail({ email: cand.email, fullName: cand.fullName, roleApplied: cand.roleApplied }); // standard test or dispatch
        // Let's use direct outreach dispatch helper
        // We'll import a standard dispatch or use nodemailer sendEmail directly:
        // import { sendEmail } from "../utils/emailService.js";
        // Actually we can invoke nodemailer
        // To be safe we'll use sendCandidateAddedEmail or email dispatch helper:
        
        cand.activityTimeline.push({
          type: "outreach_email_sent",
          message: `Bulk outreach email sent: "${subject}"`,
          performedBy: req.user.name,
          performedById: req.user._id,
          createdAt: new Date(),
        });
        await cand.save();
        count++;
      }
    }

    res.json({ message: `Outreach email campaign processed for ${count} candidates` });
  } catch (error) {
    console.error("Bulk Email Outreach Error:", error.message);
    res.status(500).json({ message: "Server error during bulk email outreach campaign" });
  }
};

// @desc    Bulk Assign selected candidates to a job / recruiter
// @route   POST /api/candidates/bulk-assign
// @access  Private (Admin, HR)
export const bulkAssignCandidates = async (req, res) => {
  try {
    const { ids, jobId } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !jobId) {
      return res.status(400).json({ message: "Required fields: ids (array) and jobId" });
    }

    if (req.user.role !== "Admin" && req.user.role !== "HR") {
      return res.status(403).json({ message: "Bulk assignment is restricted to Admin/HR" });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Target Job opening not found" });
    }

    const candidates = await Candidate.find({ _id: { $in: ids } });
    for (const cand of candidates) {
      cand.jobId = jobId;
      cand.roleApplied = job.title; // align role applied to the job title

      // Calculate AI matchmaking score
      try {
        const profileText = `Skills: ${cand.skills.join(", ")}; Experience: ${cand.experience}`;
        const comparison = await matchCandidateToJob(profileText, job);
        cand.matchScore = comparison.matchScore;
        cand.matchingSkills = comparison.matchingSkills;
        cand.missingSkills = comparison.missingSkills;
        cand.strengths = comparison.strengths;
        cand.suggestions = comparison.suggestions;
        cand.aiRecommendation = comparison.aiRecommendation;
      } catch (aiErr) {
        console.warn("Matchmaking calculation failed in bulk assign:", aiErr.message);
      }

      cand.activityTimeline.push({
        type: "job_assigned",
        message: `Assigned in bulk to job: ${job.title}`,
        performedBy: req.user.name,
        performedById: req.user._id,
        createdAt: new Date(),
      });
      await cand.save();
    }

    res.json({ message: `Successfully assigned ${ids.length} candidates to job '${job.title}'` });
  } catch (error) {
    console.error("Bulk Assignment Error:", error.message);
    res.status(500).json({ message: "Server error during bulk job assignment" });
  }
};

/**
 * Get ethical blind screening view of candidate with masked PII
 */
export const getCandidateAnonymized = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const hasAccess = await verifyAccess(req, candidate);
    if (!hasAccess) {
      return res.status(403).json({ message: "Not authorized to access candidate details" });
    }

    const anonymizedData = anonymizeCandidate(candidate);
    res.json(anonymizedData);
  } catch (error) {
    console.error("Get Anonymized Candidate Error:", error.message);
    res.status(500).json({ message: "Server error fetching anonymized candidate" });
  }
};

/**
 * Anonymize raw text string
 */
export const anonymizeRawText = async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ message: "Text string is required in request body" });
    }
    const anonymizedText = anonymizeText(text);
    res.json({ anonymizedText });
  } catch (error) {
    console.error("Anonymize Raw Text Error:", error.message);
    res.status(500).json({ message: "Server error anonymizing text" });
  }
};

/**
 * Run multi-factor candidate-job match analysis and save to candidate.matchAnalysis
 */
export const runCandidateMatchAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const { jobId } = req.body || {};

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const hasAccess = await verifyAccess(req, candidate);
    if (!hasAccess) {
      return res.status(403).json({ message: "Not authorized to access candidate details" });
    }

    const targetJobId = jobId || candidate.jobId;
    if (!targetJobId) {
      return res.status(400).json({ message: "No job ID provided or assigned to candidate for match analysis" });
    }

    const result = await analyzeAndPersistCandidateMatch(id, targetJobId);
    res.json({
      message: "Multi-factor candidate-job match analysis computed successfully",
      matchAnalysis: result,
    });
  } catch (error) {
    console.error("Run Candidate Match Analysis Error:", error.message);
    res.status(500).json({ message: error.message || "Server error performing match analysis" });
  }
};

/**
 * Generate dynamic interview kit and save to candidate.interviewKits
 */
export const generateCandidateInterviewKit = async (req, res) => {
  try {
    const { id } = req.params;
    const { jobId } = req.body || {};

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const hasAccess = await verifyAccess(req, candidate);
    if (!hasAccess) {
      return res.status(403).json({ message: "Not authorized to access candidate details" });
    }

    const targetJobId = jobId || candidate.jobId;
    if (!targetJobId) {
      return res.status(400).json({ message: "No job ID provided or assigned to candidate for interview kit generation" });
    }

    const interviewKit = await generateAndPersistInterviewKit(id, targetJobId);
    res.json({
      message: "Dynamic interview kit generated successfully",
      interviewKit,
    });
  } catch (error) {
    console.error("Generate Candidate Interview Kit Error:", error.message);
    res.status(500).json({ message: error.message || "Server error generating interview kit" });
  }
};
