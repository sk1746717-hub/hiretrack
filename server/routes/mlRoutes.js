import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Candidate from "../models/Candidate.js";
import Job from "../models/Job.js";
import * as mlService from "../services/mlService.js";
import { parsePdfBuffer } from "../utils/pdfParser.js";

const router = express.Router();

router.use(protect);

/**
 * Resolves a relative or local resume URL path to an absolute filesystem path.
 */
const resolveLocalResumePath = (urlPath) => {
  if (!urlPath) return null;

  // Strip leading slashes or backslashes
  const cleanRelPath = urlPath.replace(/^[/\\]+/, "");

  // Candidate filesystem locations
  const candidatePaths = [
    path.join(process.cwd(), cleanRelPath),
    path.join(process.cwd(), "server", cleanRelPath),
  ];

  for (const p of candidatePaths) {
    if (fsSync.existsSync(p)) {
      return p;
    }
  }

  return candidatePaths[0];
};

// GET /api/ml/health — Check Python AIML Service health
router.get("/health", async (req, res) => {
  const healthData = await mlService.getHealth();
  res.json(healthData);
});

// POST /api/ml/analyze-resume — Resume Intelligence
router.post("/analyze-resume", async (req, res) => {
  try {
    let { resumeText, candidateId } = req.body || {};

    // If candidateId is provided, extract text from the actual uploaded resume PDF
    if (!resumeText && candidateId) {
      const candidate = await Candidate.findById(candidateId);

      if (!candidate) {
        return res.status(404).json({
          message: "Candidate not found.",
        });
      }

      // Prefer the actual uploaded resume file or remote URL
      if (candidate.resumeUrl) {
        try {
          console.log(
            `[AI Resume Analysis] Downloading resume: ${candidate.resumeFileName || "Resume"}`
          );

          let buffer;

          // Check if candidate.resumeUrl is a remote HTTP/HTTPS URL (e.g. Cloudinary)
          if (/^https?:\/\//i.test(candidate.resumeUrl)) {
            console.log(`[AI Resume Analysis] Downloading remote resume: ${candidate.resumeUrl}`);
            const response = await fetch(candidate.resumeUrl);

            if (!response.ok) {
              throw new Error(`Failed to download remote resume: HTTP ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
          } else {
            // Local filesystem path (e.g., "/uploads/...", "uploads/...")
            const localPath = resolveLocalResumePath(candidate.resumeUrl);

            if (!fsSync.existsSync(localPath)) {
              console.error(`[AI Resume Analysis] Uploaded resume file is missing on server disk: ${localPath}`);
              return res.status(400).json({
                message: "Uploaded resume file is missing on server disk.",
                expectedPath: localPath,
                resumeUrl: candidate.resumeUrl,
              });
            }

            console.log(`[AI Resume Analysis] Reading local resume: ${localPath}`);
            buffer = await fs.readFile(localPath);
          }

          // Use existing parsePdfBuffer from pdfParser.js (pdfjs-dist)
          const extractedText = await parsePdfBuffer(buffer);
          resumeText = extractedText?.trim() || "";

          console.log(
            `[AI Resume Analysis] PDF text extracted successfully. Character count: ${resumeText.length}`
          );
        } catch (pdfError) {
          console.error(
            "[AI Resume Analysis] PDF extraction failed:",
            pdfError.message
          );

          return res.status(400).json({
            message: "Unable to extract text from the uploaded resume.",
            error: pdfError.message,
          });
        }
      }

      // Fallback if candidate has no uploaded resume or extraction produced empty text
      if (!resumeText) {
        resumeText = `
          ${candidate.fullName || ""}
          Skills: ${(candidate.skills || []).join(", ")}
          Experience: ${candidate.experience || ""}
          Notes: ${candidate.notes || ""}
        `.trim();

        console.log(
          "[AI Resume Analysis] No uploaded resume found or empty text. Using candidate profile data."
        );
      }
    }

    if (!resumeText) {
      return res.status(400).json({
        message: "resumeText or candidateId is required.",
      });
    }

    console.log("[AI Resume Analysis] Sending resume text to Python NLP service...");

    const result = await mlService.analyzeResume(resumeText);

    if (!result.success && result.error) {
      return res.status(503).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Express ML analyze-resume error:", error.message);

    res.status(500).json({
      message: "Server error performing resume analysis",
      error: error.message,
    });
  }
});

// POST /api/ml/match-candidate — Job-Candidate Semantic Matching
router.post("/match-candidate", async (req, res) => {
  try {
    let { job, candidate, candidateId, jobId } = req.body || {};

    if (candidateId) {
      const dbCand = await Candidate.findById(candidateId);
      if (dbCand) {
        let resumeText = `${dbCand.fullName} ${dbCand.skills.join(" ")} ${dbCand.experience} ${dbCand.notes}`;

        // Attempt PDF text extraction if resumeUrl exists
        if (dbCand.resumeUrl) {
          try {
            let buffer;
            if (/^https?:\/\//i.test(dbCand.resumeUrl)) {
              const resp = await fetch(dbCand.resumeUrl);
              if (resp.ok) buffer = Buffer.from(await resp.arrayBuffer());
            } else {
              const localPath = resolveLocalResumePath(dbCand.resumeUrl);
              if (fsSync.existsSync(localPath)) buffer = await fs.readFile(localPath);
            }
            if (buffer) {
              const parsedText = await parsePdfBuffer(buffer);
              if (parsedText && parsedText.trim()) resumeText = parsedText.trim();
            }
          } catch (e) {
            console.warn("[ML Match] PDF text extraction fallback to candidate profile:", e.message);
          }
        }

        candidate = {
          resumeText,
          skills: dbCand.skills || [],
        };
        if (!jobId && dbCand.jobId) jobId = dbCand.jobId;
      }
    }

    if (jobId) {
      const dbJob = await Job.findById(jobId);
      if (dbJob) {
        job = {
          title: dbJob.title,
          description: dbJob.description,
          requiredSkills: dbJob.requiredSkills || [],
        };
      }
    }

    if (!job || !candidate) {
      return res.status(400).json({ message: "Job and Candidate data are required." });
    }

    const result = await mlService.matchCandidate(job, candidate);
    if (!result.success && result.error) {
      return res.status(503).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Express ML match-candidate error:", error.message);
    res.status(500).json({ message: "Server error performing candidate match", error: error.message });
  }
});

// POST /api/ml/rank-candidates — Candidate Ranking
router.post("/rank-candidates", async (req, res) => {
  try {
    let { job, candidates, jobId } = req.body || {};

    if (jobId && (!candidates || candidates.length === 0)) {
      const dbJob = await Job.findById(jobId);
      if (dbJob) {
        job = {
          title: dbJob.title,
          description: dbJob.description,
          requiredSkills: dbJob.requiredSkills || [],
        };

        const dbCandidates = await Candidate.find({ jobId, isArchived: false });
        candidates = dbCandidates.map((c) => ({
          id: c._id.toString(),
          name: c.fullName,
          resumeText: `${c.fullName} ${c.skills.join(" ")} ${c.experience} ${c.notes}`,
          skills: c.skills || [],
        }));
      }
    }

    if (!job || !candidates || candidates.length === 0) {
      return res.status(400).json({ message: "Job and a non-empty list of Candidates are required." });
    }

    const result = await mlService.rankCandidates(job, candidates);
    if (!result.success && result.error) {
      return res.status(503).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Express ML rank-candidates error:", error.message);
    res.status(500).json({ message: "Server error ranking candidates", error: error.message });
  }
});

// POST /api/ml/skill-gap — Skill Gap Analysis
router.post("/skill-gap", async (req, res) => {
  try {
    let { job, candidate, candidateId, jobId } = req.body || {};

    if (candidateId) {
      const dbCand = await Candidate.findById(candidateId);
      if (dbCand) {
        let resumeText = `${dbCand.fullName} ${dbCand.skills.join(" ")} ${dbCand.experience} ${dbCand.notes}`;

        if (dbCand.resumeUrl) {
          try {
            let buffer;
            if (/^https?:\/\//i.test(dbCand.resumeUrl)) {
              const resp = await fetch(dbCand.resumeUrl);
              if (resp.ok) buffer = Buffer.from(await resp.arrayBuffer());
            } else {
              const localPath = resolveLocalResumePath(dbCand.resumeUrl);
              if (fsSync.existsSync(localPath)) buffer = await fs.readFile(localPath);
            }
            if (buffer) {
              const parsedText = await parsePdfBuffer(buffer);
              if (parsedText && parsedText.trim()) resumeText = parsedText.trim();
            }
          } catch (e) {
            console.warn("[ML Skill Gap] PDF text extraction fallback:", e.message);
          }
        }

        candidate = {
          resumeText,
          skills: dbCand.skills || [],
        };
        if (!jobId && dbCand.jobId) jobId = dbCand.jobId;
      }
    }

    if (jobId) {
      const dbJob = await Job.findById(jobId);
      if (dbJob) {
        job = {
          title: dbJob.title,
          description: dbJob.description,
          requiredSkills: dbJob.requiredSkills || [],
        };
      }
    }

    if (!job || !candidate) {
      return res.status(400).json({ message: "Job and Candidate data are required." });
    }

    const result = await mlService.analyzeSkillGap(job, candidate);
    if (!result.success && result.error) {
      return res.status(503).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Express ML skill-gap error:", error.message);
    res.status(500).json({ message: "Server error analyzing skill gap", error: error.message });
  }
});

// POST /api/ml/predict-success — ML Candidate Success Prediction
router.post("/predict-success", async (req, res) => {
  try {
    let features = req.body || {};

    // Auto compute features if candidateId and jobId are passed
    if (req.body.candidateId) {
      const dbCand = await Candidate.findById(req.body.candidateId);
      const targetJobId = req.body.jobId || dbCand?.jobId;
      const dbJob = targetJobId ? await Job.findById(targetJobId) : null;

      if (dbCand && dbJob) {
        const matchRes = await mlService.matchCandidate(
          { title: dbJob.title, description: dbJob.description, requiredSkills: dbJob.requiredSkills || [] },
          { resumeText: `${dbCand.fullName} ${dbCand.skills.join(" ")} ${dbCand.experience}`, skills: dbCand.skills || [] }
        );

        features = {
          skillMatchPercentage: matchRes.skillMatchPercentage || 75.0,
          semanticSimilarityPercentage: matchRes.semanticSimilarityPercentage || 70.0,
          relevantExperienceYears: parseFloat(dbCand.experience) || 3.0,
          interviewScore: dbCand.candidateRating ? dbCand.candidateRating * 20.0 : 75.0,
          assessmentScore: matchRes.matchScore || 75.0,
          requiredSkillsMatched: matchRes.matchedSkills?.length || 3,
          totalRequiredSkills: dbJob.requiredSkills?.length || 4,
          skillGapPercentage: 100.0 - (matchRes.skillMatchPercentage || 75.0),
        };
      }
    }

    const result = await mlService.predictSuccess(features);
    if (!result.success && result.error) {
      return res.status(503).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Express ML predict-success error:", error.message);
    res.status(500).json({ message: "Server error predicting candidate success", error: error.message });
  }
});

// POST /api/ml/interview-analysis — AI Interview Intelligence
router.post("/interview-analysis", async (req, res) => {
  try {
    let { job, candidate, interviewData, candidateId, jobId } = req.body || {};

    if (candidateId) {
      const dbCand = await Candidate.findById(candidateId);
      if (dbCand) {
        candidate = {
          resumeText: `${dbCand.fullName} ${dbCand.skills.join(" ")} ${dbCand.experience}`,
          skills: dbCand.skills || [],
        };

        if (!interviewData) {
          interviewData = {
            technicalScore: dbCand.candidateRating ? dbCand.candidateRating * 20.0 : 80.0,
            communicationScore: 80.0,
            problemSolvingScore: 85.0,
            assessmentScore: 85.0,
            interviewNotes: `${dbCand.interviewFeedback || ""} ${dbCand.notes || ""}`,
            technicalProbesAnswered: dbCand.interviewKits?.[0]?.technicalProbes?.map((p) => p.question) || [],
          };
        }

        if (!jobId && dbCand.jobId) jobId = dbCand.jobId;
      }
    }

    if (jobId) {
      const dbJob = await Job.findById(jobId);
      if (dbJob) {
        job = {
          title: dbJob.title,
          description: dbJob.description,
          requiredSkills: dbJob.requiredSkills || [],
        };
      }
    }

    const result = await mlService.analyzeInterview(job || {}, candidate || {}, interviewData || {});
    if (!result.success && result.error) {
      return res.status(503).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Express ML interview-analysis error:", error.message);
    res.status(500).json({ message: "Server error performing interview analysis", error: error.message });
  }
});

export default router;
