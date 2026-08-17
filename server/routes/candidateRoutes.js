import express from "express";
import {
  createCandidate,
  getCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
  getCandidateStats,
  archiveCandidate,
  restoreCandidate,
  addRecruiterNote,
  getCandidateReports,
  uploadResume,
  createScorecard,
  getCandidateScorecards,
  editRecruiterNote,
  deleteRecruiterNote,
  // New Controllers
  parseCandidateResume,
  generateAIQuestions,
  bulkDeleteCandidates,
  bulkUpdateStatus,
  bulkEmailCandidates,
  bulkAssignCandidates,
  getCandidateAnonymized,
  anonymizeRawText,
  runCandidateMatchAnalysis,
  generateCandidateInterviewKit,
} from "../controllers/candidateController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload, { candidateAttachmentsUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect);

// Anonymize raw text string
router.post("/anonymize-text", anonymizeRawText);

// Bulk actions (must place BEFORE /:id to avoid collision)
router.post("/bulk-delete", bulkDeleteCandidates);
router.post("/bulk-status", bulkUpdateStatus);
router.post("/bulk-email", bulkEmailCandidates);
router.post("/bulk-assign", bulkAssignCandidates);

// Resume Parsing (takes single resume file, returns AI details)
router.post("/parse", upload.single("resume"), parseCandidateResume);

// Main CRUD with multipart attachment handling
router.post("/", candidateAttachmentsUpload, createCandidate);
router.get("/", getCandidates);
router.get("/stats", getCandidateStats);
router.get("/reports", getCandidateReports);

// AI Interview questions & Interview Kit
router.post("/:id/generate-questions", generateAIQuestions);
router.post("/:id/interview-kit", generateCandidateInterviewKit);

// AI Multi-factor match analysis & Anonymized profile
router.post("/:id/match-analysis", runCandidateMatchAnalysis);
router.get("/:id/anonymized", getCandidateAnonymized);


// Upgrade Paths (archived, restore, scorecard actions, and recruiter activity notes log)
router.put("/:id/archive", archiveCandidate);
router.put("/:id/restore", restoreCandidate);
router.post("/:id/notes", addRecruiterNote);
router.put("/:id/notes/:noteId", editRecruiterNote);
router.delete("/:id/notes/:noteId", deleteRecruiterNote);
router.post("/:id/resume", upload.single("resume"), uploadResume);

router.post("/:id/scorecards", createScorecard);
router.get("/:id/scorecards", getCandidateScorecards);

router.get("/:id", getCandidateById);
router.put("/:id", candidateAttachmentsUpload, updateCandidate);
router.delete("/:id", deleteCandidate);

export default router;

