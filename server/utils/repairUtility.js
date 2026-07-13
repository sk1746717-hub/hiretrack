import Job from "../models/Job.js";
import Candidate from "../models/Candidate.js";
import User from "../models/User.js";

export const repairCandidateAssignments = async () => {
  try {
    console.log("Starting Candidate assignment repair/migration...");
    // Find candidates that need repair or whose interviewerName is missing but assignedInterviewerId is set
    const candidates = await Candidate.find({
      $or: [
        { jobId: null },
        { assignedRecruiterId: null },
        { assignedInterviewerId: null },
        { interviewerName: "" },
        { interviewerName: null }
      ]
    });

    let repairedCount = 0;
    for (const cand of candidates) {
      let job = null;

      // Try matching by jobId if exists
      if (cand.jobId) {
        job = await Job.findById(cand.jobId);
      }

      // If not matched, try matching roleApplied to an active Job title
      if (!job && cand.roleApplied) {
        job = await Job.findOne({
          title: { $regex: new RegExp(`^${cand.roleApplied.trim()}$`, "i") }
        });
      }

      if (job) {
        cand.jobId = job._id;
        cand.assignedRecruiterId = job.assignedRecruiterId || cand.assignedRecruiterId || null;
        cand.assignedInterviewerId = job.assignedInterviewerId || cand.assignedInterviewerId || null;
      }

      // If interviewer is assigned but interviewerName is empty, populate it
      if (cand.assignedInterviewerId && (!cand.interviewerName || cand.interviewerName === "")) {
        const interviewerUser = await User.findById(cand.assignedInterviewerId);
        if (interviewerUser) {
          cand.interviewerName = interviewerUser.name;
        }
      }

      await cand.save();
      repairedCount++;
    }
    console.log(`Candidate assignment repair completed. Processed/Repaired ${repairedCount} records.`);
  } catch (error) {
    console.error("Candidate assignment repair error:", error.message);
  }
};
