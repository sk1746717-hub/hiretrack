import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Candidate from "../models/Candidate.js";
import Job from "../models/Job.js";
import * as mlService from "../services/mlService.js";

const router = express.Router();

router.use(protect);

// GET /api/ml/health — Check Python AIML Service health
router.get("/health", async (req, res) => {
  const healthData = await mlService.getHealth();
  res.json(healthData);
});

// POST /api/ml/analyze-resume — Resume Intelligence
router.post("/analyze-resume", async (req, res) => {
  try {
    let { resumeText, candidateId } = req.body || {};

    if (!resumeText && candidateId) {
      const candidate = await Candidate.findById(candidateId);
      if (candidate) {
        resumeText = `${candidate.fullName} Skills: ${candidate.skills.join(", ")}; Experience: ${candidate.experience}; Notes: ${candidate.notes}`;
      }
    }

    if (!resumeText) {
      return res.status(400).json({ message: "resumeText or candidateId is required." });
    }

    const result = await mlService.analyzeResume(resumeText);
    if (!result.success && result.error) {
      return res.status(503).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Express ML analyze-resume error:", error.message);
    res.status(500).json({ message: "Server error performing resume analysis", error: error.message });
  }
});

// POST /api/ml/match-candidate — Job-Candidate Semantic Matching
router.post("/match-candidate", async (req, res) => {
  try {
    let { job, candidate, candidateId, jobId } = req.body || {};

    if (candidateId) {
      const dbCand = await Candidate.findById(candidateId);
      if (dbCand) {
        candidate = {
          resumeText: `${dbCand.fullName} ${dbCand.skills.join(" ")} ${dbCand.experience} ${dbCand.notes}`,
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
        candidate = {
          resumeText: `${dbCand.fullName} ${dbCand.skills.join(" ")} ${dbCand.experience} ${dbCand.notes}`,
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
          totalRequiredSkills: (dbJob.requiredSkills?.length) || 4,
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
