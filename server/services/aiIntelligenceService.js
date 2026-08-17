import Groq from "groq-sdk";
import Candidate from "../models/Candidate.js";
import Job from "../models/Job.js";

let groqClient;

const getGroqClient = () => {
  if (groqClient) return groqClient;
  if (!process.env.GROQ_API_KEY) {
    console.warn("Groq API key is missing. Algorithmic fallback will be used.");
    return null;
  }
  groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groqClient;
};

const extractJson = (text) => {
  if (!text) throw new Error("Empty response text");
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error("No valid JSON object found in response");
  }
  const jsonText = text.substring(firstBrace, lastBrace + 1);
  return JSON.parse(jsonText);
};

/**
 * Heuristic/algorithmic fallback calculation when Groq LLM is unavailable or fails.
 * Guarantees zero uncaught exceptions and graceful degradation.
 */
export const calculateFallbackMatchAnalysis = (candidate, job) => {
  const candidateSkills = Array.isArray(candidate?.skills)
    ? candidate.skills.map((s) => String(s).toLowerCase().trim())
    : [];

  const jobSkillsRaw = Array.isArray(job?.requiredSkills)
    ? job.requiredSkills
    : typeof job?.requiredSkills === "string"
    ? job.requiredSkills.split(",")
    : [];

  const jobSkills = jobSkillsRaw.map((s) => String(s).toLowerCase().trim()).filter(Boolean);

  let matchingSkills = [];
  let missingCriticalSkills = [];

  if (jobSkills.length > 0) {
    jobSkills.forEach((skill) => {
      if (candidateSkills.some((cs) => cs.includes(skill) || skill.includes(cs))) {
        matchingSkills.push(skill);
      } else {
        missingCriticalSkills.push(skill);
      }
    });
  } else {
    matchingSkills = candidateSkills;
  }

  const skillMatchScore = jobSkills.length > 0
    ? Math.round((matchingSkills.length / jobSkills.length) * 100)
    : 80;

  // Estimate experience match
  const candidateExpText = String(candidate?.experience || candidate?.aiSummary?.yearsOfExperience || "0");
  const candidateExpNum = parseFloat(candidateExpText) || (candidateExpText.match(/\d+(\.\d+)?/)?.[0] ? parseFloat(candidateExpText.match(/\d+(\.\d+)?/)[0]) : 2);
  const jobExpText = String(job?.experience || "0");
  const jobExpNum = parseFloat(jobExpText) || (jobExpText.match(/\d+(\.\d+)?/)?.[0] ? parseFloat(jobExpText.match(/\d+(\.\d+)?/)[0]) : 2);

  let experienceMatchScore = 75;
  if (candidateExpNum >= jobExpNum) {
    experienceMatchScore = Math.min(100, 85 + Math.round((candidateExpNum - jobExpNum) * 3));
  } else {
    experienceMatchScore = Math.max(40, 85 - Math.round((jobExpNum - candidateExpNum) * 15));
  }

  const overallFitScore = Math.round((skillMatchScore * 0.6) + (experienceMatchScore * 0.4));

  const strengths = [];
  if (matchingSkills.length > 0) {
    strengths.push(`Matches required skills: ${matchingSkills.slice(0, 4).join(", ")}`);
  }
  if (candidateExpNum >= jobExpNum) {
    strengths.push(`Meets or exceeds target experience (${candidateExpNum} yrs vs ${jobExpNum} yrs required)`);
  } else {
    strengths.push(`Relevant background in ${candidate?.roleApplied || "domain"}`);
  }

  return {
    jobId: job?._id || null,
    overallFitScore: Math.min(100, Math.max(0, overallFitScore)),
    skillMatchScore: Math.min(100, Math.max(0, skillMatchScore)),
    experienceMatchScore: Math.min(100, Math.max(0, experienceMatchScore)),
    strengths: strengths.length > 0 ? strengths : ["Solid baseline qualifications for candidate role"],
    missingCriticalSkills: missingCriticalSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    analyzedAt: new Date(),
  };
};

/**
 * Computes multi-factor candidate-job match analysis using Groq LLM or graceful fallback.
 * @param {Object} candidate - Candidate object or document
 * @param {Object} job - Job object or document
 * @returns {Promise<Object>} - Multi-factor match analysis
 */
export const computeCandidateJobMatch = async (candidate, job) => {
  if (!candidate || !job) {
    return calculateFallbackMatchAnalysis(candidate, job);
  }

  const client = getGroqClient();
  if (!client) {
    return calculateFallbackMatchAnalysis(candidate, job);
  }

  const candidateSkills = Array.isArray(candidate.skills) ? candidate.skills.join(", ") : (candidate.skills || "N/A");
  const jobSkills = Array.isArray(job.requiredSkills) ? job.requiredSkills.join(", ") : (job.requiredSkills || "N/A");

  const prompt = `
You are an expert AI talent intelligence engine. Perform a comprehensive, multi-factor match analysis between a candidate and a job opening.

JSON Schema:
{
  "overallFitScore": number (integer 0-100 representing composite match),
  "skillMatchScore": number (integer 0-100 specifically evaluating skill alignment),
  "experienceMatchScore": number (integer 0-100 specifically evaluating experience level and background relevance),
  "strengths": ["string (top 2-4 strong matching factors, e.g. domain knowledge, key skills)"],
  "missingCriticalSkills": ["string (critical required skills for job that candidate lacks)"]
}

You MUST return ONLY valid JSON matching the schema above.
Do NOT include markdown, explanations, or code blocks.

Job Details:
Title: ${job.title || "N/A"}
Department: ${job.department || "N/A"}
Required Skills: ${jobSkills}
Experience Target: ${job.experience || "N/A"}
Description: ${job.description || "N/A"}

Candidate Details:
Role Applied: ${candidate.roleApplied || "N/A"}
Experience: ${candidate.experience || "N/A"}
Skills: ${candidateSkills}
AI Summary: ${candidate.aiSummary?.textSummary || candidate.notes || "N/A"}
`;

  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 1000,
    });

    const rawContent = response.choices[0]?.message?.content;
    const parsed = extractJson(rawContent);

    return {
      jobId: job._id,
      overallFitScore: typeof parsed.overallFitScore === "number" ? Math.min(100, Math.max(0, parsed.overallFitScore)) : 70,
      skillMatchScore: typeof parsed.skillMatchScore === "number" ? Math.min(100, Math.max(0, parsed.skillMatchScore)) : 70,
      experienceMatchScore: typeof parsed.experienceMatchScore === "number" ? Math.min(100, Math.max(0, parsed.experienceMatchScore)) : 70,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      missingCriticalSkills: Array.isArray(parsed.missingCriticalSkills) ? parsed.missingCriticalSkills : [],
      analyzedAt: new Date(),
    };
  } catch (error) {
    console.error("Groq Multi-factor Match Analysis Error:", error.message);
    return calculateFallbackMatchAnalysis(candidate, job);
  }
};

/**
 * Analyzes candidate-job match and updates the candidate's matchAnalysis array in DB.
 * @param {string} candidateId - Candidate ID
 * @param {string} targetJobId - Optional target Job ID (defaults to candidate.jobId)
 * @returns {Promise<Object>} - The saved match analysis result
 */
export const analyzeAndPersistCandidateMatch = async (candidateId, targetJobId = null) => {
  try {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }

    const jobIdToUse = targetJobId || candidate.jobId;
    if (!jobIdToUse) {
      throw new Error("No job assigned or provided for match analysis");
    }

    const job = await Job.findById(jobIdToUse);
    if (!job) {
      throw new Error("Job not found");
    }

    const analysis = await computeCandidateJobMatch(candidate, job);

    // Update candidate's matchAnalysis array (replace existing entry for this jobId or push new)
    if (!Array.isArray(candidate.matchAnalysis)) {
      candidate.matchAnalysis = [];
    }

    const existingIndex = candidate.matchAnalysis.findIndex(
      (m) => m.jobId && m.jobId.toString() === job._id.toString()
    );

    if (existingIndex >= 0) {
      candidate.matchAnalysis[existingIndex] = analysis;
    } else {
      candidate.matchAnalysis.push(analysis);
    }

    // Also update legacy top-level matchScore for backward compatibility
    candidate.matchScore = analysis.overallFitScore;
    if (analysis.strengths && analysis.strengths.length > 0) {
      candidate.strengths = analysis.strengths;
    }
    if (analysis.missingCriticalSkills && analysis.missingCriticalSkills.length > 0) {
      candidate.missingSkills = analysis.missingCriticalSkills;
    }

    await candidate.save();
    return analysis;
  } catch (error) {
    console.error("analyzeAndPersistCandidateMatch Error:", error.message);
    throw error;
  }
};



/**
 * Heuristic fallback for Interview Kit generation when Groq AI is unavailable or fails.
 */
export const calculateFallbackInterviewKit = (candidate, job) => {
  const jobTitle = job?.title || candidate?.roleApplied || "Software Engineer";
  const candidateSkills = Array.isArray(candidate?.skills) ? candidate.skills : [];
  const jobSkillsRaw = Array.isArray(job?.requiredSkills)
    ? job.requiredSkills
    : typeof job?.requiredSkills === "string"
    ? job.requiredSkills.split(",")
    : [];
  const jobSkills = jobSkillsRaw.map((s) => String(s).trim()).filter(Boolean);

  const tech1 = jobSkills[0] || candidateSkills[0] || "Core Architecture";
  const tech2 = jobSkills[1] || candidateSkills[1] || "Database & API Design";
  const tech3 = jobSkills[2] || "Performance & Testing";

  return {
    jobId: job?._id || null,
    title: `Interview Kit for ${jobTitle}`,
    createdAt: new Date(),
    technicalProbes: [
      {
        topic: tech1,
        context: `Evaluates core technical proficiency in ${tech1} for the ${jobTitle} role.`,
        question: `How have you utilized ${tech1} in your previous production projects to solve key engineering challenges?`,
        expectedAnswerPoints: [
          `Clear architectural overview of ${tech1} implementation`,
          `Discussion of trade-offs, state management, or scalability considerations`,
          `Real-world debugging or optimization experience`,
        ],
      },
      {
        topic: tech2,
        context: `Assesses knowledge in ${tech2} and system API integration.`,
        question: `Can you walk us through how you design APIs and manage data persistence with ${tech2}?`,
        expectedAnswerPoints: [
          `RESTful / GraphQL endpoint structure standards`,
          `Handling authentication, error conditions, and rate limits`,
          `Database indexing and query efficiency strategies`,
        ],
      },
      {
        topic: tech3,
        context: `Probes testing, reliability, and code quality in ${tech3}.`,
        question: `What automated testing strategies and CI/CD practices do you apply when developing software?`,
        expectedAnswerPoints: [
          `Unit testing, integration testing, and mock setups`,
          `Automated continuous integration build pipelines`,
          `Code review and quality enforcement practices`,
        ],
      },
    ],
    experienceProbes: [
      {
        area: "System Design & Architecture",
        question: `Describe a scenario where a system component degraded under high traffic. How did you diagnose and resolve the bottleneck?`,
        evaluationCriteria: "Evaluates systematic debugging, root-cause analysis, caching strategies, and horizontal scaling awareness.",
      },
      {
        area: "Leadership & Collaboration",
        question: `Tell me about a technical disagreement you had with a team member or stakeholder. How did you align on a solution?`,
        evaluationCriteria: "Assesses communication skill, empathy, constructive conflict resolution, and objective data-driven decision making.",
      },
    ],
  };
};

/**
 * Generates dynamic interview rubric (interview kit) using Groq LLM or graceful fallback.
 */
export const generateInterviewKit = async (candidate, job) => {
  if (!candidate || !job) {
    return calculateFallbackInterviewKit(candidate, job);
  }

  const client = getGroqClient();
  if (!client) {
    return calculateFallbackInterviewKit(candidate, job);
  }

  const candidateSkills = Array.isArray(candidate.skills) ? candidate.skills.join(", ") : (candidate.skills || "N/A");
  const jobSkills = Array.isArray(job.requiredSkills) ? job.requiredSkills.join(", ") : (job.requiredSkills || "N/A");

  const prompt = `
You are an expert technical interviewer designing a dynamic interview rubric (interview kit) for evaluating a candidate for a role.
Analyze the candidate's resume/skills against the job description and output a JSON object according to the schema below.

Target JSON Schema:
{
  "technicalProbes": [
    {
      "topic": "string (core technology or skill area)",
      "context": "string (specific gap or project technology identified from candidate profile)",
      "question": "string (deep technical question tailored to candidate background and role requirements)",
      "expectedAnswerPoints": ["string (key points an ideal response should cover)"]
    }
  ],
  "experienceProbes": [
    {
      "area": "string (e.g. System Design / Leadership / Scale / Problem Solving)",
      "question": "string (behavioral or scenario question tailored to role seniority)",
      "evaluationCriteria": "string (what the interviewer should look for in candidate response)"
    }
  ]
}

Ensure you provide 3 detailed technical probes and 2 experience probes.
You MUST return ONLY valid JSON matching the schema above.
Do NOT include markdown, code blocks, or explanatory text.

Job Opening:
Title: ${job.title || "N/A"}
Department: ${job.department || "N/A"}
Required Skills: ${jobSkills}
Experience: ${job.experience || "N/A"}
Description: ${job.description || "N/A"}

Candidate Profile:
Role Applied: ${candidate.roleApplied || "N/A"}
Skills: ${candidateSkills}
Experience: ${candidate.experience || "N/A"}
AI Summary: ${candidate.aiSummary?.textSummary || candidate.notes || "N/A"}
`;

  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const rawContent = response.choices[0]?.message?.content;
    const parsed = extractJson(rawContent);

    return {
      jobId: job._id,
      title: `Interview Kit for ${job.title || candidate.roleApplied}`,
      createdAt: new Date(),
      technicalProbes: Array.isArray(parsed.technicalProbes) ? parsed.technicalProbes : [],
      experienceProbes: Array.isArray(parsed.experienceProbes) ? parsed.experienceProbes : [],
    };
  } catch (error) {
    console.error("Groq Interview Kit Generation Error:", error.message);
    return calculateFallbackInterviewKit(candidate, job);
  }
};

/**
 * Generates and persists an interview kit to candidate.interviewKits array in MongoDB.
 */
export const generateAndPersistInterviewKit = async (candidateId, targetJobId = null) => {
  try {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }

    const jobIdToUse = targetJobId || candidate.jobId;
    if (!jobIdToUse) {
      throw new Error("No job assigned or provided for interview kit generation");
    }

    const job = await Job.findById(jobIdToUse);
    if (!job) {
      throw new Error("Job not found");
    }

    const kit = await generateInterviewKit(candidate, job);

    if (!Array.isArray(candidate.interviewKits)) {
      candidate.interviewKits = [];
    }

    // Prepend new kit to candidate.interviewKits array
    candidate.interviewKits.unshift(kit);
    await candidate.save();
    return kit;
  } catch (error) {
    console.error("generateAndPersistInterviewKit Error:", error.message);
    throw error;
  }
};

export default {
  computeCandidateJobMatch,
  calculateFallbackMatchAnalysis,
  analyzeAndPersistCandidateMatch,
  calculateFallbackInterviewKit,
  generateInterviewKit,
  generateAndPersistInterviewKit,
};


