import Groq from "groq-sdk";

let groqClient;

const getGroqClient = () => {
  if (groqClient) return groqClient;
  if (!process.env.GROQ_API_KEY) {
    console.warn("Groq API key is missing");
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
 * Parse candidate resume text and compile candidate information and professional summaries.
 * @param {string} resumeText - Extracted text content of the resume
 * @returns {Promise<object>} - Parsed profile object
 */
export const parseResumeAndSummarize = async (resumeText) => {
  const client = getGroqClient();
  if (!client) {
    throw new Error("Groq API is not configured. Resume cannot be parsed.");
  }

  const prompt = `
You are an expert AI recruiter parsing a candidate's resume text.
Extract the details and generate a structured professional summary in JSON format matching the schema below.

JSON Schema:
{
  "fullName": "string (Candidate's full name, capitalized)",
  "email": "string (Candidate's email address, lowercase)",
  "phone": "string (Candidate's phone number)",
  "skills": ["string (Individual technical and soft skills)"],
  "education": "string (Brief summary of candidate's highest level of education)",
  "experience": "string (Brief summary of candidate's professional work experience)",
  "aiSummary": {
    "yearsOfExperience": number (estimated total years of professional experience, e.g. 2.5),
    "primarySkills": ["string (Top 3-5 core technical skills)"],
    "education": "string (Brief highest degree and school, e.g. B.S. CS at MIT)",
    "careerHighlights": ["string (Top 2-3 notable accomplishments or projects extracted from resume)"],
    "suitableRoles": ["string (Potential job titles candidate fits, e.g. Backend Developer)"],
    "textSummary": "string (A concise 3-4 sentence professional summary of the candidate's background, expertise, and strengths)"
  }
}

You MUST return ONLY a valid JSON object.
Do NOT include explanations.
Do NOT include markdown.
Do NOT include code fences.
Do NOT repeat resume text.
Do NOT output any text before or after the JSON.

Resume Text:
${resumeText}
`;

  let rawContent = "";
  try {
    const response = await client.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    
    rawContent = response.choices[0].message.content;
    return extractJson(rawContent);
  } catch (error) {
    console.error("Groq Parse Resume Error:", error.message);
    if (rawContent) {
      console.error("Failed to parse JSON. Raw response content:", rawContent);
    }
    throw new Error("Failed to parse resume text using Groq AI: " + error.message);
  }
};

/**
 * Compare candidate details/resume with job description to calculate match score and recommendations.
 * @param {string} resumeText - Candidate's resume details or text
 * @param {object} job - Job document details (title, description, requiredSkills, experience)
 * @returns {Promise<object>} - AI Job Match analysis
 */
export const matchCandidateToJob = async (resumeText, job) => {
  const client = getGroqClient();
  if (!client) {
    console.log("Groq API key missing. Simulating AI job matching...");
    return {
      matchScore: 82,
      matchingSkills: ["React", "Node.js", "Express", "MongoDB", "JavaScript"],
      missingSkills: ["TypeScript", "Docker"],
      strengths: [
        "Strong MERN stack codebase familiarity",
        "Direct experience building RESTful APIs",
        "Solid foundations in React UI design"
      ],
      suggestions: [
        "Acquire basic proficiency in TypeScript for typed Javascript safety",
        "Familiarize with containerization using Docker"
      ],
      aiRecommendation: {
        level: "Recommended",
        explanation: "The candidate possesses a strong profile in MongoDB, Express, React, and Node.js. They fit 80% of the skills requested. However, they lack TypeScript and Docker which are listed as preferred requirements for this role."
      }
    };
  }

  const prompt = `
You are an expert technical interviewer and recruiter. Compare the candidate's resume/skills with the job description.
Assess the match score (0-100), identify matching/missing skills, list strengths, suggestions, and provide an official hiring recommendation level.

Hiring Recommendation Levels:
- "Strongly Recommended" (Excellent fit, ticks almost all boxes)
- "Recommended" (Good fit, has the core skills but minor gaps)
- "Consider" (Borderline, lacks some core skills but has relevant background)
- "Not Recommended" (Poor fit, missing major requirements)

JSON Schema:
{
  "matchScore": number (integer between 0 and 100),
  "matchingSkills": ["string (skills matching the job requirements)"],
  "missingSkills": ["string (required skills from job description missing in resume)"],
  "strengths": ["string (top 2-3 positive attributes matching candidate's profile to the job)"],
  "suggestions": ["string (constructive feedback/skills candidate should acquire to improve compatibility)"],
  "aiRecommendation": {
    "level": "string (MUST be one of: 'Strongly Recommended', 'Recommended', 'Consider', 'Not Recommended')",
    "explanation": "string (A 2-3 sentence clear justification explaining why this recommendation level and match score were assigned)"
  }
}

You MUST return ONLY a valid JSON object.
Do NOT include explanations.
Do NOT include markdown.
Do NOT include code fences.
Do NOT repeat resume text.
Do NOT output any text before or after the JSON.

Job Opening:
Title: ${job.title}
Department: ${job.department}
Description: ${job.description}
Required Skills: ${Array.isArray(job.requiredSkills) ? job.requiredSkills.join(", ") : job.requiredSkills}
Target Experience: ${job.experience}

Candidate Details/Resume:
${resumeText}
`;

  let rawContent = "";
  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    rawContent = response.choices[0].message.content;
    return extractJson(rawContent);
  } catch (error) {
    console.error("Groq Job Match Error:", error.message);
    if (rawContent) {
      console.error("Failed to parse JSON. Raw response content:", rawContent);
    }
    throw new Error("Failed to match candidate to job description: " + error.message);
  }
};

/**
 * Generate interview questions based on candidate profile and job requirements.
 * @param {string} resumeText - Candidate resume text or profile details
 * @param {object} job - Job opening details
 * @returns {Promise<object>} - Interview questions object
 */
export const generateQuestionsForCandidate = async (resumeText, job) => {
  const client = getGroqClient();
  if (!client) {
    console.log("Groq API key missing. Simulating AI interview questions generation...");
    return {
      technical: [
        "Can you explain the life cycle of a React component and where you would make an API call?",
        "How do you implement authentication in a Node/Express app using JWT?",
        "What strategies do you use to optimize MongoDB queries, and how do database indexes work?"
      ],
      hr: [
        "Why are you interested in joining our team as a " + (job?.title || "Software Engineer") + "?",
        "Tell me about a time you faced a conflict in a development team and how you resolved it.",
        "What are your long-term career aspirations and how does this role align with them?"
      ],
      scenario: [
        "If a production database query takes over 10 seconds to execute, what steps would you take to diagnose and resolve the issue?",
        "Explain how you would handle a situation where a product deadline is in 2 days but a critical bug is discovered in the core features."
      ],
      coding: [
        "Write a simple Node.js middleware function that validates if an incoming request header has a valid Bearer token.",
        "Implement a function in JavaScript to check if two strings are anagrams of each other (ignore casing and spaces)."
      ]
    };
  }

  const prompt = `
You are an expert interviewer. Design customized interview questions for a candidate applying for the role.
Questions must be tailored specifically to the candidate's resume/skills and the job requirements.

JSON Schema:
{
  "technical": ["string (3 technical questions focusing on candidate's skills and job needs)"],
  "hr": ["string (2 behavioral/HR questions about background, team collaboration, and goals)"],
  "scenario": ["string (2 scenario-based engineering problem solving questions relevant to the role)"],
  "coding": ["string (2 coding/system design exercises tailored to the candidate's core stack)"]
}

You MUST return ONLY a valid JSON object.
Do NOT include explanations.
Do NOT include markdown.
Do NOT include code fences.
Do NOT repeat resume text.
Do NOT output any text before or after the JSON.

Job Opening:
Title: ${job.title}
Required Skills: ${Array.isArray(job.requiredSkills) ? job.requiredSkills.join(", ") : job.requiredSkills}
Description: ${job.description}

Candidate Details/Resume:
${resumeText}
`;

  let rawContent = "";
  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    rawContent = response.choices[0].message.content;
    return extractJson(rawContent);
  } catch (error) {
    console.error("Groq Question Generator Error:", error.message);
    if (rawContent) {
      console.error("Failed to parse JSON. Raw response content:", rawContent);
    }
    throw new Error("Failed to generate interview questions: " + error.message);
  }
};
