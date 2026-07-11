import Candidate from "../models/Candidate.js";
import Scorecard from "../models/Scorecard.js";

const createCandidate = async (req, res) => {
  try {
    const {
      fullName, email, phone, roleApplied, status, experience, skills, notes,
      currentCompany, currentLocation, noticePeriod, source, linkedinUrl, resumeUrl,
      expectedSalary, lastContactedDate, interviewDate, interviewTime, interviewMode,
      interviewerName, interviewRound, interviewStatus, interviewFeedback,
      interviewerFeedback, interviewDecision, candidateRating
    } = req.body;

    if (!fullName || !email || !phone || !roleApplied) {
      return res.status(400).json({ message: "Please provide all required fields: fullName, email, phone, and roleApplied" });
    }

    let processedSkills = skills;
    if (typeof skills === "string") {
      processedSkills = skills.split(",").map(skill => skill.trim()).filter(Boolean);
    }

    const candidate = await Candidate.create({
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
      resumeUrl: resumeUrl || "",
      expectedSalary: expectedSalary || "",
      lastContactedDate: lastContactedDate || null,
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
          createdAt: new Date(),
        },
      ],
    });

    res.status(201).json(candidate);
  } catch (error) {
    console.error("Create Candidate Error:", error.message);
    res.status(500).json({ message: "Server error while creating candidate" });
  }
};

const getCandidates = async (req, res) => {
  try {
    const query = {};
    if (req.user.role !== "Interviewer") {
      query.userId = req.user._id;
    }

    // Archived query filter handling: true (only archived), all (both active and archived), false/default (only active)
    if (req.query.archived === "true") {
      query.isArchived = true;
    } else if (req.query.archived === "all") {
      // Do not restrict by isArchived (returns both active and archived candidates)
    } else {
      query.isArchived = false;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.source) {
      query.source = req.query.source;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      query.$or = [
        { fullName: searchRegex },
        { roleApplied: searchRegex }
      ];
    }

    // Determine sort ordering
    let sortObj = { createdAt: -1 }; // newest first (default)
    if (req.query.sort) {
      switch (req.query.sort) {
        case "oldest":
          sortObj = { createdAt: 1 };
          break;
        case "nameAsc":
          sortObj = { fullName: 1 };
          break;
        case "nameDesc":
          sortObj = { fullName: -1 };
          break;
        case "newest":
        default:
          sortObj = { createdAt: -1 };
          break;
      }
    }

    // Check if pagination is requested
    if (req.query.page || req.query.limit) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const totalCandidates = await Candidate.countDocuments(query);
      const totalPages = Math.ceil(totalCandidates / limit);
      const candidates = await Candidate.find(query).sort(sortObj).skip(skip).limit(limit);

      return res.json({
        candidates,
        currentPage: page,
        totalPages,
        totalCandidates,
      });
    }

    const candidates = await Candidate.find(query).sort(sortObj);
    res.json(candidates);
  } catch (error) {
    console.error("Get Candidates Error:", error.message);
    res.status(500).json({ message: "Server error while fetching candidates" });
  }
};

const getCandidateById = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== "Interviewer") {
      query.userId = req.user._id;
    }
    const candidate = await Candidate.findOne(query);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }
    res.json(candidate);
  } catch (error) {
    console.error("Get Candidate By ID Error:", error.message);
    res.status(500).json({ message: "Server error while fetching candidate details" });
  }
};

const updateCandidate = async (req, res) => {
  try {
    const {
      fullName, email, phone, roleApplied, status, experience, skills, notes,
      currentCompany, currentLocation, noticePeriod, source, linkedinUrl, resumeUrl,
      expectedSalary, lastContactedDate, interviewDate, interviewTime, interviewMode,
      interviewerName, interviewRound, isArchived, interviewStatus, interviewFeedback,
      interviewerFeedback, interviewDecision, candidateRating
    } = req.body;

    let candidate = await Candidate.findOne({ _id: req.params.id, userId: req.user._id });
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    let processedSkills = skills;
    if (typeof skills === "string") {
      processedSkills = skills.split(",").map(skill => skill.trim()).filter(Boolean);
    }

    // Capture changes for activity timeline
    const timelineEvents = [];

    if (status !== undefined && status !== candidate.status) {
      timelineEvents.push({
        type: "status_change",
        message: `Status changed from ${candidate.status} to ${status}`,
        createdAt: new Date(),
      });
    }

    if (interviewDate !== undefined && String(interviewDate) !== String(candidate.interviewDate)) {
      const dateStr = interviewDate ? new Date(interviewDate).toLocaleDateString() : "Unscheduled";
      timelineEvents.push({
        type: "interview_scheduled",
        message: `Interview scheduled/rescheduled for date: ${dateStr}`,
        createdAt: new Date(),
      });
    }

    if (interviewDecision !== undefined && interviewDecision !== candidate.interviewDecision) {
      timelineEvents.push({
        type: "interview_decision",
        message: `Recruiter selection decision updated to: ${interviewDecision || "None"}`,
        createdAt: new Date(),
      });
    }

    candidate.fullName = fullName !== undefined ? fullName : candidate.fullName;
    candidate.email = email !== undefined ? email : candidate.email;
    candidate.phone = phone !== undefined ? phone : candidate.phone;
    candidate.roleApplied = roleApplied !== undefined ? roleApplied : candidate.roleApplied;
    candidate.status = status !== undefined ? status : candidate.status;
    candidate.experience = experience !== undefined ? experience : candidate.experience;
    candidate.skills = processedSkills !== undefined ? processedSkills : candidate.skills;
    candidate.notes = notes !== undefined ? notes : candidate.notes;

    // Upgraded Profile fields
    candidate.currentCompany = currentCompany !== undefined ? currentCompany : candidate.currentCompany;
    candidate.currentLocation = currentLocation !== undefined ? currentLocation : candidate.currentLocation;
    candidate.noticePeriod = noticePeriod !== undefined ? noticePeriod : candidate.noticePeriod;
    candidate.source = source !== undefined ? source : candidate.source;
    candidate.linkedinUrl = linkedinUrl !== undefined ? linkedinUrl : candidate.linkedinUrl;
    candidate.resumeUrl = resumeUrl !== undefined ? resumeUrl : candidate.resumeUrl;
    candidate.expectedSalary = expectedSalary !== undefined ? expectedSalary : candidate.expectedSalary;
    candidate.lastContactedDate = lastContactedDate !== undefined ? lastContactedDate : candidate.lastContactedDate;

    // Upgraded Interview fields
    candidate.interviewDate = interviewDate !== undefined ? interviewDate : candidate.interviewDate;
    candidate.interviewTime = interviewTime !== undefined ? interviewTime : candidate.interviewTime;
    candidate.interviewMode = interviewMode !== undefined ? interviewMode : candidate.interviewMode;
    candidate.interviewerName = interviewerName !== undefined ? interviewerName : candidate.interviewerName;
    candidate.interviewRound = interviewRound !== undefined ? interviewRound : candidate.interviewRound;
    candidate.interviewStatus = interviewStatus !== undefined ? interviewStatus : candidate.interviewStatus;
    candidate.interviewFeedback = interviewFeedback !== undefined ? interviewFeedback : candidate.interviewFeedback;

    // Upgraded decision fields
    candidate.interviewerFeedback = interviewerFeedback !== undefined ? interviewerFeedback : candidate.interviewerFeedback;
    candidate.interviewDecision = interviewDecision !== undefined ? interviewDecision : candidate.interviewDecision;
    candidate.candidateRating = candidateRating !== undefined ? Number(candidateRating) : candidate.candidateRating;

    // Archive support
    candidate.isArchived = isArchived !== undefined ? isArchived : candidate.isArchived;

    // Accept custom activityTimeline updates if passed
    if (req.body.activityTimeline !== undefined) {
      candidate.activityTimeline = req.body.activityTimeline;
    }

    // Append any timeline events
    if (timelineEvents.length > 0) {
      if (!candidate.activityTimeline) {
        candidate.activityTimeline = [];
      }
      candidate.activityTimeline.push(...timelineEvents);
    }

    const updatedCandidate = await candidate.save();
    res.json(updatedCandidate);
  } catch (error) {
    console.error("Update Candidate Error:", error.message);
    res.status(500).json({ message: "Server error while updating candidate" });
  }
};

const deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }
    res.json({ message: "Candidate deleted successfully" });
  } catch (error) {
    console.error("Delete Candidate Error:", error.message);
    res.status(500).json({ message: "Server error while deleting candidate" });
  }
};

const getCandidateStats = async (req, res) => {
  try {
    const matchQuery = { isArchived: false };
    if (req.user.role !== "Interviewer") {
      matchQuery.userId = req.user._id;
    }

    // Exclude archived candidates by default (as requested)
    const stats = await Candidate.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const defaultStats = {
      total: 0,
      Applied: 0,
      Screening: 0,
      Interview: 0,
      Selected: 0,
      Rejected: 0,
    };

    stats.forEach((item) => {
      if (defaultStats.hasOwnProperty(item._id)) {
        defaultStats[item._id] = item.count;
      }
    });

    const countQuery = { isArchived: false };
    if (req.user.role !== "Interviewer") {
      countQuery.userId = req.user._id;
    }
    defaultStats.total = await Candidate.countDocuments(countQuery);

    res.json(defaultStats);
  } catch (error) {
    console.error("Get Stats Error:", error.message);
    res.status(500).json({ message: "Server error while computing stats" });
  }
};

const archiveCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ _id: req.params.id, userId: req.user._id });
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }
    candidate.isArchived = true;
    
    if (!candidate.activityTimeline) candidate.activityTimeline = [];
    candidate.activityTimeline.push({
      type: "candidate_archived",
      message: "Candidate moved to archive",
      createdAt: new Date(),
    });

    await candidate.save();
    res.json({ message: "Candidate archived successfully", candidate });
  } catch (error) {
    console.error("Archive Candidate Error:", error.message);
    res.status(500).json({ message: "Server error while archiving candidate" });
  }
};

const restoreCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ _id: req.params.id, userId: req.user._id });
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }
    candidate.isArchived = false;

    if (!candidate.activityTimeline) candidate.activityTimeline = [];
    candidate.activityTimeline.push({
      type: "candidate_restored",
      message: "Candidate restored to active pipeline",
      createdAt: new Date(),
    });

    await candidate.save();
    res.json({ message: "Candidate restored successfully", candidate });
  } catch (error) {
    console.error("Restore Candidate Error:", error.message);
    res.status(500).json({ message: "Server error while restoring candidate" });
  }
};

const addRecruiterNote = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ message: "Note text is required and cannot be empty" });
    }

    const candidate = await Candidate.findOne({ _id: req.params.id, userId: req.user._id });
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    candidate.notesHistory.push({
      text: text.trim(),
      createdAt: new Date(),
    });

    if (!candidate.activityTimeline) candidate.activityTimeline = [];
    candidate.activityTimeline.push({
      type: "note_added",
      message: "Recruiter note added to history",
      createdAt: new Date(),
    });

    await candidate.save();
    res.status(201).json(candidate);
  } catch (error) {
    console.error("Add Recruiter Note Error:", error.message);
    res.status(500).json({ message: "Server error while adding recruiter note" });
  }
};

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded or invalid format" });
    }

    const candidate = await Candidate.findOne({ _id: req.params.id, userId: req.user._id });
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    candidate.resumeFileName = req.file.originalname;
    candidate.resumePath = `/uploads/${req.file.filename}`;
    candidate.resumeUploadedAt = new Date();
    candidate.resumeUrl = `/uploads/${req.file.filename}`; // Update resumeUrl to make it openable

    if (!candidate.activityTimeline) candidate.activityTimeline = [];
    candidate.activityTimeline.push({
      type: "resume_uploaded",
      message: `Resume document uploaded: ${req.file.originalname}`,
      createdAt: new Date(),
    });

    await candidate.save();
    res.json({ message: "Resume uploaded successfully", candidate });
  } catch (error) {
    console.error("Upload Resume Error:", error.message);
    res.status(500).json({ message: "Server error while uploading resume" });
  }
};

const getCandidateReports = async (req, res) => {
  try {
    const userId = req.user._id;
    const matchQueryActive = { isArchived: false };
    const matchQueryArchived = { isArchived: true };
    const matchQueryInterviews = { isArchived: false, interviewDate: { $ne: null } };
    
    if (req.user.role !== "Interviewer") {
      matchQueryActive.userId = userId;
      matchQueryArchived.userId = userId;
      matchQueryInterviews.userId = userId;
    }

    // 1. Stage stats
    const stageStats = await Candidate.aggregate([
      { $match: matchQueryActive },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // 2. Source stats
    const sourceStats = await Candidate.aggregate([
      { $match: matchQueryActive },
      { $group: { _id: "$source", count: { $sum: 1 } } }
    ]);

    // 3. Overall counts
    const activeCount = await Candidate.countDocuments(matchQueryActive);
    const archivedCount = await Candidate.countDocuments(matchQueryArchived);

    // 4. Scheduled Interviews count (has date, active candidate)
    const interviewsCount = await Candidate.countDocuments(matchQueryInterviews);

    // 5. Recent additions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentQuery = { createdAt: { $gte: sevenDaysAgo } };
    if (req.user.role !== "Interviewer") {
      recentQuery.userId = userId;
    }
    const recentAdditionsCount = await Candidate.countDocuments(recentQuery);

    // 6. Time-to-hire calculation (average days to hire a candidate from creation to 'Selected' stage)
    const findSelectedQuery = { status: "Selected" };
    if (req.user.role !== "Interviewer") {
      findSelectedQuery.userId = userId;
    }
    const hiredCandidates = await Candidate.find(findSelectedQuery);

    let avgTimeToHire = 0;
    if (hiredCandidates.length > 0) {
      const totalDays = hiredCandidates.reduce((acc, c) => {
        const durationMs = new Date(c.updatedAt) - new Date(c.createdAt);
        const durationDays = durationMs / (1000 * 60 * 60 * 24);
        return acc + Math.max(durationDays, 1); // Minimum 1 day
      }, 0);
      avgTimeToHire = Math.round(totalDays / hiredCandidates.length);
    }

    res.json({
      stageStats,
      sourceStats,
      activeCount,
      archivedCount,
      interviewsCount,
      recentAdditionsCount,
      avgTimeToHire
    });
  } catch (error) {
    console.error("Get Reports Data Error:", error.message);
    res.status(500).json({ message: "Server error while computing reports data" });
  }
};

const createScorecard = async (req, res) => {
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

    if (!communicationScore || !technicalScore || !problemSolvingScore || !cultureFitScore || !overallRecommendation) {
      return res.status(400).json({ message: "Please provide all required scorecard scores and recommendations" });
    }

    const candidate = await Candidate.findOne({ _id: id, userId: req.user._id });
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
    
    if (!candidate.activityTimeline) candidate.activityTimeline = [];
    candidate.activityTimeline.push({
      type: "scorecard_added",
      message: `Scorecard evaluation submitted: ${overallRecommendation}`,
      createdAt: new Date(),
    });

    await candidate.save();

    res.status(201).json({ scorecard, candidate });
  } catch (error) {
    console.error("Create Scorecard Error:", error.message);
    res.status(500).json({ message: "Server error while creating scorecard" });
  }
};

const getCandidateScorecards = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findOne({ _id: id, userId: req.user._id });
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const scorecards = await Scorecard.find({ candidateId: id, userId: req.user._id }).sort({ createdAt: -1 });
    res.json(scorecards);
  } catch (error) {
    console.error("Get Scorecards Error:", error.message);
    res.status(500).json({ message: "Server error while fetching scorecards" });
  }
};

const editRecruiterNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Note text cannot be empty" });
    }

    const candidate = await Candidate.findOne({ _id: id, userId: req.user._id });
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const note = candidate.notesHistory.id(noteId);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    note.text = text;

    if (!candidate.activityTimeline) candidate.activityTimeline = [];
    candidate.activityTimeline.push({
      type: "note_edited",
      message: `Recruiter note updated`,
      createdAt: new Date(),
    });

    await candidate.save();
    res.json(candidate);
  } catch (error) {
    console.error("Edit Note Error:", error.message);
    res.status(500).json({ message: "Server error while editing recruiter note" });
  }
};

const deleteRecruiterNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;

    const candidate = await Candidate.findOne({ _id: id, userId: req.user._id });
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const note = candidate.notesHistory.id(noteId);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    candidate.notesHistory.pull(noteId);

    if (!candidate.activityTimeline) candidate.activityTimeline = [];
    candidate.activityTimeline.push({
      type: "note_deleted",
      message: `Recruiter note deleted`,
      createdAt: new Date(),
    });

    await candidate.save();
    res.json(candidate);
  } catch (error) {
    console.error("Delete Note Error:", error.message);
    res.status(500).json({ message: "Server error while deleting recruiter note" });
  }
};

export {
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
};
