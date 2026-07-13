import React, { useState, useEffect } from "react";
import jobService from "../services/jobService";
import candidateService from "../services/candidateService";
import toast from "react-hot-toast";

const CandidateForm = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [jobs, setJobs] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [coverLetterFile, setCoverLetterFile] = useState(null);
  const [certificateFiles, setCertificateFiles] = useState([]);
  
  // AI Parsing states
  const [isParsing, setIsParsing] = useState(false);
  const [aiParsedFields, setAiParsedFields] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    roleApplied: "",
    status: "Applied",
    experience: "",
    skills: "",
    notes: "",
    // Job Reference
    jobId: "",
    // ATS details
    currentCompany: "",
    currentLocation: "",
    noticePeriod: "",
    source: "",
    linkedinUrl: "",
    resumeUrl: "",
    expectedSalary: "",
    lastContactedDate: "",
    // Legacy Interview details
    interviewDate: "",
    interviewTime: "",
    interviewMode: "",
    interviewerName: "",
    interviewRound: "",
  });

  // Fetch active jobs for assignment dropdown
  useEffect(() => {
    const fetchActiveJobs = async () => {
      try {
        const data = await jobService.getJobs("", "", "Active", "1", "100");
        setJobs(data.jobs || []);
      } catch (err) {
        console.error("Failed to load jobs list in CandidateForm:", err);
      }
    };
    fetchActiveJobs();
  }, []);

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      return d.toISOString().split("T")[0];
    } catch (e) {
      return "";
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        roleApplied: initialData.roleApplied || "",
        status: initialData.status || "Applied",
        experience: initialData.experience || "",
        skills: Array.isArray(initialData.skills) ? initialData.skills.join(", ") : initialData.skills || "",
        notes: initialData.notes || "",
        jobId: initialData.jobId?._id || initialData.jobId || "",
        currentCompany: initialData.currentCompany || "",
        currentLocation: initialData.currentLocation || "",
        noticePeriod: initialData.noticePeriod || "",
        source: initialData.source || "",
        linkedinUrl: initialData.linkedinUrl || "",
        resumeUrl: initialData.resumeUrl || "",
        expectedSalary: initialData.expectedSalary || "",
        lastContactedDate: formatDateForInput(initialData.lastContactedDate),
        interviewDate: formatDateForInput(initialData.interviewDate),
        interviewTime: initialData.interviewTime || "",
        interviewMode: initialData.interviewMode || "",
        interviewerName: initialData.interviewerName || "",
        interviewRound: initialData.interviewRound || "",
      });
      setResumeFile(null);
      setCoverLetterFile(null);
      setCertificateFiles([]);
      setAiParsedFields(null);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleJobChange = (e) => {
    const selectedJobId = e.target.value;
    const selectedJob = jobs.find(j => j._id === selectedJobId);
    setFormData(prev => ({
      ...prev,
      jobId: selectedJobId,
      // Pre-fill the role name with the Job's Title automatically
      roleApplied: selectedJob ? selectedJob.title : prev.roleApplied
    }));
  };

  // Instant AI Resume Parsing on PDF upload
  const handleResumeChange = async (e) => {
    const file = e.target.files[0];
    setResumeFile(file);
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Resume auto-parsing is only supported for PDF files.");
      return;
    }

    try {
      setIsParsing(true);
      console.log("[Frontend Parse Status] File selected. Starting parse process...");
      const parsePromise = candidateService.parseResumeFile(file);

      toast.promise(parsePromise, {
        loading: "AI extracting resume text and details...",
        success: "Resume parsed successfully! Form fields pre-filled.",
        error: (err) => err.response?.data?.message || err.message || "Failed to parse resume text.",
      });

      const response = await parsePromise;
      if (response && response.parsedData) {
        console.log("[Frontend Parse Status] Received parsed data from API:", response.parsedData);
        try {
          const { fullName, email, phone, skills, education, experience } = response.parsedData;
          
          setFormData(prev => ({
            ...prev,
            fullName: fullName || prev.fullName,
            email: email || prev.email,
            phone: phone || prev.phone,
            skills: Array.isArray(skills) ? skills.join(", ") : skills || prev.skills,
            experience: experience || prev.experience,
          }));

          setAiParsedFields(response.parsedData);
          console.log("[Frontend Parse Status] Form autofilled successfully.");
        } catch (autofillError) {
          console.error("[Frontend Parse Failure] Error during form autofill:", autofillError);
        }
      }
    } catch (error) {
      console.error("[Frontend Parse Failure] Error during resume parsing lifecycle:", error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone || !formData.roleApplied) {
      toast.error("Please fill in all required fields marked with *");
      return;
    }

    const skillsArray = formData.skills
      ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const submissionData = {
      ...formData,
      skills: skillsArray,
      lastContactedDate: formData.lastContactedDate || null,
      interviewDate: formData.interviewDate || null,
    };

    // If we have AI parsed metadata, attach them directly so they get saved
    if (aiParsedFields) {
      submissionData.aiSummary = aiParsedFields.aiSummary;
    }

    // Attach cover letter and certificates to submissionData to be processed by file API wrapper
    if (coverLetterFile) {
      submissionData.coverLetterFile = coverLetterFile;
    }
    if (certificateFiles.length > 0) {
      submissionData.certificateFiles = certificateFiles;
    }

    onSubmit(submissionData, resumeFile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-slate-350 select-none">
      
      {/* Section A: Basic Info */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800/80 pb-2">
          Section A: Basic Candidate Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Assign Job Posting
            </label>
            <select
              name="jobId"
              value={formData.jobId}
              onChange={handleJobChange}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="">Choose Job (optional)</option>
              {jobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title} - {job.department}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Role Applied For <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="roleApplied"
              required
              value={formData.roleApplied}
              onChange={handleChange}
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="name@company.com"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 XXXXX XXXXX"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Experience (Years / Details)
            </label>
            <input
              type="text"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              placeholder="e.g. 3 years"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Pipeline Stage
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-955 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="Applied">Applied</option>
              <option value="Screening">Screening</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interview">Interview</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Skills (Comma-separated)
            </label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="React, CSS, Node.js, Git"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Recruiter Summary Notes
          </label>
          <textarea
            name="notes"
            rows="3"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Candidate career context notes..."
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 resize-none"
          />
        </div>
      </div>

      {/* Section B: File & Application Management */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800/80 pb-2">
          Section B: Document Management & ATS Profiles
        </h3>

        {/* Cloudinary File Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5 bg-slate-950/20 p-4 rounded-xl border border-slate-900">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Resume (.pdf only for parsing)
            </label>
            <input
              type="file"
              accept=".pdf"
              disabled={isParsing}
              onChange={handleResumeChange}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-blue-600/20 file:text-blue-400 file:cursor-pointer hover:file:bg-blue-600/30"
            />
            {isParsing && (
              <span className="text-[9px] text-blue-400 animate-pulse block mt-1">AI parsing active...</span>
            )}
            {initialData?.resumeFileName && !resumeFile && (
              <span className="text-[9px] text-emerald-400 block mt-1 truncate">Current: {initialData.resumeFileName}</span>
            )}
          </div>

          <div className="space-y-1.5 bg-slate-950/20 p-4 rounded-xl border border-slate-900">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Cover Letter (.pdf, .doc)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setCoverLetterFile(e.target.files[0])}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-blue-600/20 file:text-blue-400 file:cursor-pointer hover:file:bg-blue-600/30"
            />
            {initialData?.coverLetterUrl && !coverLetterFile && (
              <span className="text-[9px] text-emerald-400 block mt-1">Uploaded Cover Letter loaded</span>
            )}
          </div>

          <div className="space-y-1.5 bg-slate-950/20 p-4 rounded-xl border border-slate-900">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Certificates (Multiple)
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              multiple
              onChange={(e) => setCertificateFiles(Array.from(e.target.files))}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-blue-600/20 file:text-blue-400 file:cursor-pointer hover:file:bg-blue-600/30"
            />
            {initialData?.certificates?.length > 0 && (
              <span className="text-[9px] text-emerald-400 block mt-1">{initialData.certificates.length} Certificate(s) loaded</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Current Company
            </label>
            <input
              type="text"
              name="currentCompany"
              value={formData.currentCompany}
              onChange={handleChange}
              placeholder="Tech Corp Inc."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Current Location
            </label>
            <input
              type="text"
              name="currentLocation"
              value={formData.currentLocation}
              onChange={handleChange}
              placeholder="Bangalore, IN"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Notice Period
            </label>
            <input
              type="text"
              name="noticePeriod"
              value={formData.noticePeriod}
              onChange={handleChange}
              placeholder="Immediate, 30 days"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Applicant Source
            </label>
            <input
              type="text"
              name="source"
              value={formData.source}
              onChange={handleChange}
              placeholder="LinkedIn, Referral"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              LinkedIn Profile URL
            </label>
            <input
              type="url"
              name="linkedinUrl"
              value={formData.linkedinUrl}
              onChange={handleChange}
              placeholder="https://linkedin.com/..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Expected Salary
            </label>
            <input
              type="text"
              name="expectedSalary"
              value={formData.expectedSalary}
              onChange={handleChange}
              placeholder="12 LPA"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Last Contacted Date
            </label>
            <input
              type="date"
              name="lastContactedDate"
              value={formData.lastContactedDate}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50"
              style={{ colorScheme: "dark" }}
            />
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800/80">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40 text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || isParsing}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving Profile...
            </>
          ) : initialData ? (
            "Save Upgrade"
          ) : (
            "Add Candidate"
          )}
        </button>
      </div>
    </form>
  );
};

export default CandidateForm;
