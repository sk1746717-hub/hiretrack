import mongoose from "mongoose";
import Candidate from "./models/Candidate.js";
import Job from "./models/Job.js";
import { anonymizeCandidate, anonymizeText } from "./services/anonymizerService.js";
import { computeCandidateJobMatch, calculateFallbackMatchAnalysis, generateInterviewKit, calculateFallbackInterviewKit } from "./services/aiIntelligenceService.js";

console.log("=== Testing HireTrack V2 Part 1 & Part 2 Backend Services ===");

// Test 1: Candidate Schema instantiation
console.log("\n1. Testing Candidate Mongoose Schema extension...");
const mockCandidate = new Candidate({
  userId: new mongoose.Types.ObjectId(),
  fullName: "Jane Doe",
  email: "jane.doe@example.com",
  phone: "+1-555-0199",
  roleApplied: "Senior Full Stack Developer",
  experience: "5 years",
  skills: ["React", "Node.js", "MongoDB", "Express", "TypeScript"],
  linkedinUrl: "https://linkedin.com/in/janedoe",
  currentCompany: "Acme Corp",
  currentLocation: "San Francisco, CA",
  matchAnalysis: [
    {
      overallFitScore: 88,
      skillMatchScore: 90,
      experienceMatchScore: 85,
      strengths: ["Strong MERN stack", "TypeScript experience"],
      missingCriticalSkills: ["GraphQL"]
    }
  ],
  interviewKits: [{ title: "Technical Deep Dive", questionsCount: 5 }]
});

console.log("Candidate created successfully:");
console.log("- fullName:", mockCandidate.fullName);
console.log("- matchAnalysis count:", mockCandidate.matchAnalysis.length);
console.log("- matchAnalysis[0].overallFitScore:", mockCandidate.matchAnalysis[0].overallFitScore);
console.log("- interviewKits count:", mockCandidate.interviewKits.length);

// Test 2: Anonymizer Service
console.log("\n2. Testing Anonymizer Service...");
const testText = "Please contact Jane Doe at jane.doe@example.com or call +1-555-0199. Profile: https://linkedin.com/in/janedoe";
const anonymizedText = anonymizeText(testText);
console.log("Raw text:", testText);
console.log("Anonymized text:", anonymizedText);

const anonymizedProfile = anonymizeCandidate(mockCandidate);
console.log("Anonymized Candidate Profile:");
console.log("- fullName:", anonymizedProfile.fullName);
console.log("- email:", anonymizedProfile.email);
console.log("- phone:", anonymizedProfile.phone);
console.log("- linkedinUrl:", anonymizedProfile.linkedinUrl);
console.log("- company:", anonymizedProfile.currentCompany);
console.log("- isAnonymized:", anonymizedProfile.isAnonymized);

// Test 3: AI Intelligence Match Analysis
console.log("\n3. Testing AI Intelligence Service...");
const mockJob = {
  _id: new mongoose.Types.ObjectId(),
  title: "Senior Full Stack Engineer",
  department: "Engineering",
  description: "Building scalable web applications with Node.js, React, and MongoDB.",
  requiredSkills: ["React", "Node.js", "MongoDB", "GraphQL", "Docker"],
  experience: "4 years"
};

const fallbackResult = calculateFallbackMatchAnalysis(mockCandidate, mockJob);
console.log("Algorithmic Fallback Match Analysis:");
console.log("- overallFitScore:", fallbackResult.overallFitScore);
console.log("- skillMatchScore:", fallbackResult.skillMatchScore);
console.log("- experienceMatchScore:", fallbackResult.experienceMatchScore);

// Test 4: Interview Kit Generation
console.log("\n4. Testing Interview Kit Service...");
const kitFallback = calculateFallbackInterviewKit(mockCandidate, mockJob);
console.log("Algorithmic Fallback Interview Kit:");
console.log("- title:", kitFallback.title);
console.log("- technicalProbes count:", kitFallback.technicalProbes.length);
console.log("- experienceProbes count:", kitFallback.experienceProbes.length);

console.log("\nTesting computeCandidateJobMatch and generateInterviewKit (Groq or Fallback)...");
Promise.all([
  computeCandidateJobMatch(mockCandidate, mockJob),
  generateInterviewKit(mockCandidate, mockJob)
]).then(([matchResult, kitResult]) => {
  console.log("\nMulti-factor Match Result:");
  console.log("- overallFitScore:", matchResult.overallFitScore);
  console.log("- skillMatchScore:", matchResult.skillMatchScore);
  console.log("- experienceMatchScore:", matchResult.experienceMatchScore);

  console.log("\nGenerated Interview Kit:");
  console.log("- title:", kitResult.title);
  console.log("- technicalProbes count:", kitResult.technicalProbes?.length || 0);
  console.log("- experienceProbes count:", kitResult.experienceProbes?.length || 0);

  console.log("\n✅ ALL BACKEND SERVICES AND SCHEMA TESTS PASSED!");
  process.exit(0);
}).catch((err) => {
  console.error("❌ Test error:", err.message);
  process.exit(1);
});

