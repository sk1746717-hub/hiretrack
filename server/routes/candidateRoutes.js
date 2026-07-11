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
  deleteRecruiterNote
} from "../controllers/candidateController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createCandidate);
router.get("/", getCandidates);
router.get("/stats", getCandidateStats);
router.get("/reports", getCandidateReports);

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
router.put("/:id", updateCandidate);
router.delete("/:id", deleteCandidate);

export default router;
