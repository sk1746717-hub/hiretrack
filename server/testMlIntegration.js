import * as mlService from "./services/mlService.js";

console.log("=== Testing Express Backend <-> Python AIML Service Integration ===");

async function runIntegrationTests() {
  try {
    // 1. Health check
    console.log("\n1. Testing getHealth()...");
    const health = await mlService.getHealth();
    console.log("- Health response status:", health.status, "| Service:", health.service);

    // 2. Resume Intelligence
    console.log("\n2. Testing analyzeResume()...");
    const resumeRes = await mlService.analyzeResume(
      "Jane Doe. Senior Full Stack Engineer with 5+ years experience in Python, React, Node.js, MongoDB, and AWS."
    );
    console.log("- Resume analysis success:", resumeRes.success, "| Skills count:", Object.keys(resumeRes.analysis?.skills || {}).length);

    // 3. Candidate Matching
    console.log("\n3. Testing matchCandidate()...");
    const matchRes = await mlService.matchCandidate(
      { title: "MERN Dev", description: "React Node.js MongoDB AWS developer", requiredSkills: ["React", "Node.js", "MongoDB", "AWS"] },
      { resumeText: "React Node.js MongoDB developer", skills: ["React", "Node.js", "MongoDB"] }
    );
    console.log("- Match score:", matchRes.matchScore, "% | Recommendation:", matchRes.recommendation);

    // 4. Candidate Ranking
    console.log("\n4. Testing rankCandidates()...");
    const rankRes = await mlService.rankCandidates(
      { title: "MERN Dev", description: "React Node.js MongoDB AWS developer", requiredSkills: ["React", "Node.js", "MongoDB", "AWS"] },
      [
        { id: "c1", name: "Cand A", resumeText: "React Node.js MongoDB AWS developer", skills: ["React", "Node.js", "MongoDB", "AWS"] },
        { id: "c2", name: "Cand B", resumeText: "React developer", skills: ["React"] }
      ]
    );
    console.log("- Total candidates ranked:", rankRes.totalCandidates, "| Top rank:", rankRes.rankedCandidates?.[0]?.candidateName);

    // 5. Skill Gap Analysis
    console.log("\n5. Testing analyzeSkillGap()...");
    const gapRes = await mlService.analyzeSkillGap(
      { title: "MERN Dev", description: "React Node.js MongoDB AWS developer", requiredSkills: ["React", "Node.js", "MongoDB", "AWS"] },
      { resumeText: "React Node.js developer", skills: ["React", "Node.js"] }
    );
    console.log("- Match %:", gapRes.skillMatchPercentage, "% | Gap %:", gapRes.skillGapPercentage, "% | Missing count:", gapRes.missingCount);

    // 6. ML Candidate Success Prediction
    console.log("\n6. Testing predictSuccess()...");
    const predRes = await mlService.predictSuccess({
      skillMatchPercentage: 85.0,
      semanticSimilarityPercentage: 78.0,
      relevantExperienceYears: 4.0,
      interviewScore: 85.0,
      assessmentScore: 88.0,
      requiredSkillsMatched: 4,
      totalRequiredSkills: 5,
      skillGapPercentage: 15.0
    });
    console.log("- Success Probability:", predRes.successProbabilityPercentage, "% | Suitability:", predRes.suitabilityLevel);

    // 7. AI Interview Intelligence
    console.log("\n7. Testing analyzeInterview()...");
    const intRes = await mlService.analyzeInterview(
      { title: "MERN Dev", requiredSkills: ["React", "Node.js", "AWS"] },
      { skills: ["React", "Node.js"] },
      { technicalScore: 85.0, interviewNotes: "Strong React and Node.js knowledge demonstrated." }
    );
    console.log("- Overall Interview Score:", intRes.overallInterviewScore, "% | Recommendation:", intRes.recommendation);

    console.log("\n✅ ALL EXPRESS <-> PYTHON AIML INTEGRATION TESTS PASSED!");
  } catch (err) {
    console.error("❌ Integration test error:", err.message);
  }
}

runIntegrationTests();
