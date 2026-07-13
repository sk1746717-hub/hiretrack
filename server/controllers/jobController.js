import Job from "../models/Job.js";
import AuditLog from "../models/AuditLog.js";
import Candidate from "../models/Candidate.js";
import User from "../models/User.js";

// @desc    Get all jobs (with pagination & filters)
// @route   GET /api/jobs
// @access  Private
export const getJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const department = req.query.department || "";
    const status = req.query.status || "";

    const query = {};

    // RBAC: Recruiters view assigned recruiter jobs, Interviewers view assigned interviewer jobs
    if (req.user.role === "Recruiter") {
      query.assignedRecruiterId = req.user._id;
    } else if (req.user.role === "Interviewer") {
      query.assignedInterviewerId = req.user._id;
    }

    // Apply Search Filter
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    // Apply Department Filter
    if (department) {
      query.department = department;
    }

    // Apply Status Filter
    if (status) {
      query.status = status;
    }

    // Pagination Calculations
    const skip = (page - 1) * limit;
    const total = await Job.countDocuments(query);
    const pages = Math.ceil(total / limit);

    const jobs = await Job.find(query)
      .populate("assignedRecruiterId", "name email")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      jobs,
      page,
      pages,
      limit,
      total,
    });
  } catch (error) {
    console.error("Get Jobs Error:", error.message);
    res.status(500).json({ message: "Server error while fetching jobs" });
  }
};

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Private
export const getJobById = async (req, res) => {
  try {
    const query = { _id: req.params.id };

    // RBAC: Recruiters and Interviewers only view their assigned jobs
    if (req.user.role === "Recruiter") {
      query.assignedRecruiterId = req.user._id;
    } else if (req.user.role === "Interviewer") {
      query.assignedInterviewerId = req.user._id;
    }

    const job = await Job.findOne(query)
      .populate("assignedRecruiterId", "name email")
      .populate("userId", "name email");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
  } catch (error) {
    console.error("Get Job By ID Error:", error.message);
    res.status(500).json({ message: "Server error while fetching job details" });
  }
};

// @desc    Create a new job posting
// @route   POST /api/jobs
// @access  Private (Admin, HR)
export const createJob = async (req, res) => {
  try {
    const { title, department, description, requiredSkills, experience, salary, deadline, status, assignedRecruiterId, assignedInterviewerId } = req.body;

    if (!title || !department) {
      return res.status(400).json({ message: "Title and Department are required fields" });
    }

    let processedSkills = requiredSkills;
    if (typeof requiredSkills === "string") {
      processedSkills = requiredSkills.split(",").map(s => s.trim()).filter(Boolean);
    }

    const job = await Job.create({
      title,
      department,
      description: description || "",
      requiredSkills: processedSkills || [],
      experience: experience || "",
      salary: salary || "",
      deadline: deadline || null,
      status: status || "Active",
      userId: req.user._id,
      assignedRecruiterId: assignedRecruiterId || null,
      assignedInterviewerId: assignedInterviewerId || null,
    });

    // Logging Audit
    await AuditLog.create({
      action: "JOB_CREATE",
      performedBy: req.user._id,
      details: `Created job posting: ${title} (${department})`,
    });

    res.status(201).json(job);
  } catch (error) {
    console.error("Create Job Error:", error.message);
    res.status(500).json({ message: "Server error while creating job opening" });
  }
};

// @desc    Update an existing job posting
// @route   PUT /api/jobs/:id
// @access  Private (Admin, HR)
export const updateJob = async (req, res) => {
  try {
    const { title, department, description, requiredSkills, experience, salary, deadline, status, assignedRecruiterId, assignedInterviewerId } = req.body;

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    let processedSkills = requiredSkills;
    if (typeof requiredSkills === "string") {
      processedSkills = requiredSkills.split(",").map(s => s.trim()).filter(Boolean);
    }

    job.title = title !== undefined ? title : job.title;
    job.department = department !== undefined ? department : job.department;
    job.description = description !== undefined ? description : job.description;
    job.requiredSkills = processedSkills !== undefined ? processedSkills : job.requiredSkills;
    job.experience = experience !== undefined ? experience : job.experience;
    job.salary = salary !== undefined ? salary : job.salary;
    job.deadline = deadline !== undefined ? deadline : job.deadline;
    job.status = status !== undefined ? status : job.status;
    job.assignedRecruiterId = assignedRecruiterId !== undefined ? assignedRecruiterId : job.assignedRecruiterId;
    job.assignedInterviewerId = assignedInterviewerId !== undefined ? assignedInterviewerId : job.assignedInterviewerId;

    const updatedJob = await job.save();

    // Fetch interviewer user details if assigned
    let interviewerNameVal = "";
    if (job.assignedInterviewerId) {
      const intUser = await User.findById(job.assignedInterviewerId);
      if (intUser) {
        interviewerNameVal = intUser.name;
      }
    }

    // Synchronize latest assignments to all Candidates of this Job
    const candidatesToUpdate = await Candidate.find({ jobId: job._id });
    for (const cand of candidatesToUpdate) {
      cand.assignedRecruiterId = job.assignedRecruiterId || null;
      cand.assignedInterviewerId = job.assignedInterviewerId || null;
      cand.roleApplied = job.title;
      if (!cand.interviewerName && interviewerNameVal) {
        cand.interviewerName = interviewerNameVal;
      }
      await cand.save();
    }

    // Logging Audit
    await AuditLog.create({
      action: "JOB_UPDATE",
      performedBy: req.user._id,
      details: `Updated job opening: ${job.title}`,
    });

    res.json(updatedJob);
  } catch (error) {
    console.error("Update Job Error:", error.message);
    res.status(500).json({ message: "Server error while updating job opening" });
  }
};

// @desc    Delete job posting
// @route   DELETE /api/jobs/:id
// @access  Private (Admin, HR)
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const title = job.title;
    await job.deleteOne();

    // Logging Audit
    await AuditLog.create({
      action: "JOB_DELETE",
      performedBy: req.user._id,
      details: `Deleted job opening: ${title}`,
    });

    res.json({ message: "Job opening deleted successfully" });
  } catch (error) {
    console.error("Delete Job Error:", error.message);
    res.status(500).json({ message: "Server error while deleting job opening" });
  }
};
