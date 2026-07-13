import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import candidateService from "../services/candidateService";
import authService from "../services/authService";
import templateService from "../services/templateService";
import Loader from "../components/Loader";
import CandidateForm from "../components/CandidateForm";

const PREDEFINED_TEMPLATES = [
  {
    _id: "predefined-invitation",
    name: "Interview Invitation",
    subject: "Interview Invitation - {{jobRole}} - HireTrack",
    body: "Dear {{candidateName}},\n\nWe are pleased to invite you for an interview for the {{jobRole}} position at {{company}}.\n\nDate: {{interviewDate}}\nTime: {{interviewTime}}\n\nLooking forward to speaking with you.\n\nBest regards,\n{{recruiterName}}"
  },
  {
    _id: "predefined-reminder",
    name: "Interview Reminder",
    subject: "Reminder: Interview for {{jobRole}} - HireTrack",
    body: "Dear {{candidateName}},\n\nThis is a friendly reminder of your upcoming interview for the {{jobRole}} position at {{company}}.\n\nDate: {{interviewDate}}\nTime: {{interviewTime}}\n\nPlease let us know if you need to reschedule.\n\nRegards,\n{{recruiterName}}"
  },
  {
    _id: "predefined-received",
    name: "Application Received",
    subject: "Application Received - {{jobRole}} - HireTrack",
    body: "Dear {{candidateName}},\n\nThank you for applying for the {{jobRole}} position at {{company}}. We have received your application and will review it shortly.\n\nBest regards,\n{{recruiterName}}"
  },
  {
    _id: "predefined-shortlisted",
    name: "Shortlisted",
    subject: "Great News: Shortlisted for {{jobRole}} - HireTrack",
    body: "Dear {{candidateName}},\n\nCongratulations! We have shortlisted your application for the {{jobRole}} position at {{company}}. We will contact you soon to schedule the next steps.\n\nBest regards,\n{{recruiterName}}"
  },
  {
    _id: "predefined-rejected",
    name: "Rejected",
    subject: "Application Update - {{jobRole}} - HireTrack",
    body: "Dear {{candidateName}},\n\nThank you for your interest in the {{jobRole}} position at {{company}}. After careful review, we have decided to move forward with other candidates whose profiles align more closely with our needs at this time.\n\nWe wish you all the best.\n\nSincerely,\n{{recruiterName}}"
  },
  {
    _id: "predefined-offer",
    name: "Offer Letter",
    subject: "Job Offer: {{jobRole}} - HireTrack",
    body: "Dear {{candidateName}},\n\nWe are thrilled to offer you the position of {{jobRole}} at {{company}}! Please find your offer letter attached.\n\nWe are looking forward to welcoming you to the team.\n\nBest regards,\n{{recruiterName}}"
  },
  {
    _id: "predefined-followup",
    name: "Follow-up Reminder",
    subject: "Follow-up regarding {{jobRole}} application - HireTrack",
    body: "Dear {{candidateName}},\n\nI hope this email finds you well. I am following up on your application for the {{jobRole}} position at {{company}}. Please let me know your availability for a quick update.\n\nRegards,\n{{recruiterName}}"
  }
];

const CandidateDetails = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Tab state: 'overview' | 'scorecards' | 'questions' | 'documents'
  const [activeTab, setActiveTab] = useState("overview");

  // Recruiter notes
  const [noteText, setNoteText] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState("");

  // Documents modal previewer
  const [previewFileUrl, setPreviewFileUrl] = useState("");
  const [previewFileName, setPreviewFileName] = useState("");

  // Interviewer feedback form states
  const [feedbackRating, setFeedbackRating] = useState("");
  const [feedbackDecision, setFeedbackDecision] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("Scheduled");
  const [feedbackRemarks, setFeedbackRemarks] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // Scorecard modal
  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [scorecards, setScorecards] = useState([]);
  const [commScore, setCommScore] = useState(3);
  const [techScore, setTechScore] = useState(3);
  const [problemScore, setProblemScore] = useState(3);
  const [cultureScore, setCultureScore] = useState(3);
  const [recVal, setRecVal] = useState("Hire");
  const [scorecardComments, setScorecardComments] = useState("");
  const [scorecardSubmitting, setScorecardSubmitting] = useState(false);

  // AI Interview Questions
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  // Email Outreach Modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [newAttachmentFile, setNewAttachmentFile] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Interview scheduler state (rescheduling / scheduling)
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulerSubmitting, setSchedulerSubmitting] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    interviewDate: "",
    interviewTime: "",
    interviewMode: "Online",
    interviewerName: "",
    interviewRound: "Technical Round",
  });

  const fetchCandidateDetails = async () => {
    try {
      setLoading(true);
      const data = await candidateService.getCandidateById(id);
      setCandidate(data);
      
      const cards = await candidateService.getCandidateScorecards(id);
      setScorecards(cards || []);
    } catch (error) {
      console.error("Fetch Details Error:", error);
      toast.error("Failed to load candidate details");
      navigate("/candidates");
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await templateService.getTemplates();
      setTemplates(data || []);
    } catch (err) {
      console.error("Fetch Templates Error:", err);
    }
  };

  useEffect(() => {
    fetchCandidateDetails();
    fetchTemplates();
  }, [id]);

  const resolvePreviewUrl = (url) => {
    if (!url) return "";
    
    // If it contains /uploads/, extract path from /uploads/ and prepend correct backend base
    if (url.includes("/uploads/")) {
      const uploadPath = url.substring(url.indexOf("/uploads/"));
      const backendBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
      return `${backendBase}${uploadPath}`;
    }
    
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    const backendBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${backendBase}${path}`;
  };

  const handlePreviewFile = async (url, name) => {
    if (!url) {
      setPreviewFileUrl("");
      setPreviewFileName("");
      toast.error("File is not available");
      return;
    }
    try {
      const resolved = resolvePreviewUrl(url);
      const res = await fetch(resolved, { method: "HEAD" });
      if (res.status === 404) {
        setPreviewFileUrl("ERROR_NOT_FOUND");
        setPreviewFileName(name);
        return;
      }
      
      const isPdf = /\.pdf$/i.test(resolved.split("?")[0]);
      if (isPdf) {
        window.open(resolved, "_blank");
        setPreviewFileUrl("");
        setPreviewFileName("");
        return;
      }
      
      setPreviewFileUrl(resolved);
      setPreviewFileName(name);
    } catch (err) {
      const resolved = resolvePreviewUrl(url);
      const isPdf = /\.pdf$/i.test(resolved.split("?")[0]);
      if (isPdf) {
        window.open(resolved, "_blank");
        setPreviewFileUrl("");
        setPreviewFileName("");
      } else {
        setPreviewFileUrl(resolved);
        setPreviewFileName(name);
      }
    }
  };

  useEffect(() => {
    if (candidate) {
      setFeedbackRating(candidate.candidateRating || "");
      setFeedbackDecision(candidate.interviewDecision || "");
      setFeedbackStatus(candidate.interviewStatus || "Scheduled");
      setFeedbackRemarks(candidate.interviewerFeedback || candidate.interviewFeedback || "");
    }
  }, [candidate]);

  const handleFeedbackSubmitInterviewer = async (e) => {
    e.preventDefault();
    try {
      setFeedbackSubmitting(true);
      await candidateService.updateCandidate(id, {
        candidateRating: Number(feedbackRating) || undefined,
        interviewDecision: feedbackDecision,
        interviewStatus: feedbackStatus,
        interviewerFeedback: feedbackRemarks,
        interviewFeedback: feedbackRemarks
      });
      toast.success("Interview feedback saved successfully!");
      // Manually trigger detail reload
      const data = await candidateService.getCandidateById(id);
      setCandidate(data);
    } catch (error) {
      console.error("Save Feedback Error:", error);
      toast.error("Failed to save interview feedback");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Handle Edit Candidate
  const handleUpdate = async (formData, resumeFile) => {
    setIsSubmitting(true);
    try {
      // Re-map skills, files and structures
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "skills") {
          submitData.append("skills", formData.skills.join(", "));
        } else if (formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key]);
        }
      });

      if (resumeFile) {
        submitData.append("resume", resumeFile);
      }
      if (formData.coverLetterFile) {
        submitData.append("coverLetter", formData.coverLetterFile);
      }
      if (formData.certificateFiles) {
        for (const file of formData.certificateFiles) {
          submitData.append("certificates", file);
        }
      }

      await candidateService.updateCandidate(id, submitData);
      toast.success("Candidate profile updated!");
      setShowEditModal(false);
      fetchCandidateDetails();
    } catch (error) {
      console.error("Update Error:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Archive status
  const handleArchiveToggle = async () => {
    try {
      if (candidate.isArchived) {
        await candidateService.restoreCandidate(id);
        toast.success("Candidate restored!");
      } else {
        await candidateService.archiveCandidate(id);
        toast.success("Candidate archived successfully!");
      }
      fetchCandidateDetails();
    } catch (error) {
      console.error(error);
      toast.error("Archive status update failed");
    }
  };

  // Delete Candidate
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this candidate profile?")) return;
    try {
      await candidateService.deleteCandidate(id);
      toast.success("Candidate profile deleted!");
      navigate("/candidates");
    } catch (error) {
      console.error(error);
      toast.error("Delete candidate failed");
    }
  };

  // Add Recruiter Note
  const handleAddNoteSubmit = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      setNoteText("");
      setNoteSubmitting(true);
      await candidateService.addRecruiterNote(id, noteText);
      toast.success("Recruiter note added!");
      fetchCandidateDetails();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add note");
    } finally {
      setNoteSubmitting(false);
    }
  };

  // Edit Note
  const handleEditNoteStart = (note) => {
    setEditingNoteId(note._id);
    setEditingNoteText(note.text);
  };

  const handleEditNoteSubmit = async (noteId) => {
    if (!editingNoteText.trim()) return;
    try {
      await candidateService.editRecruiterNote(id, noteId, editingNoteText);
      toast.success("Note updated!");
      setEditingNoteId(null);
      setEditingNoteText("");
      fetchCandidateDetails();
    } catch (error) {
      console.error(error);
      toast.error("Failed to edit note");
    }
  };

  // Delete Note
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await candidateService.deleteRecruiterNote(id, noteId);
      toast.success("Note deleted");
      fetchCandidateDetails();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete note");
    }
  };

  // Schedule Interview History Round
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleData.interviewDate || !scheduleData.interviewTime) {
      toast.error("Date and Time are required");
      return;
    }

    try {
      setSchedulerSubmitting(true);
      await candidateService.updateCandidate(id, {
        interviewDate: scheduleData.interviewDate,
        interviewTime: scheduleData.interviewTime,
        interviewMode: scheduleData.interviewMode,
        interviewerName: scheduleData.interviewerName,
        interviewRound: scheduleData.interviewRound,
        interviewStatus: "Scheduled",
      });
      toast.success("Interview scheduled! Email sent to candidate.");
      setShowScheduleModal(false);
      fetchCandidateDetails();
    } catch (error) {
      console.error(error);
      toast.error("Failed to schedule interview");
    } finally {
      setSchedulerSubmitting(false);
    }
  };

  // AI Interview Questions Generator trigger
  const handleGenerateQuestions = async () => {
    try {
      setGeneratingQuestions(true);
      await candidateService.generateAIQuestions(id);
      toast.success("AI interview questions generated successfully!");
      fetchCandidateDetails();
      setActiveTab("questions");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate questions using Groq AI");
    } finally {
      setGeneratingQuestions(false);
    }
  };

  // Submit Scorecard
  const handleScorecardSubmit = async (e) => {
    e.preventDefault();
    try {
      setScorecardSubmitting(true);
      await candidateService.createScorecard(id, {
        communicationScore: commScore,
        technicalScore: techScore,
        problemSolvingScore: problemScore,
        cultureFitScore: cultureScore,
        overallRecommendation: recVal,
        interviewerComments: scorecardComments,
      });
      toast.success("Interviewer evaluation scorecard submitted!");
      setShowScorecardModal(false);
      setScorecardComments("");
      fetchCandidateDetails();
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit scorecard");
    } finally {
      setScorecardSubmitting(false);
    }
  };

  const replaceTemplateVariables = (text) => {
    if (!text) return "";
    const companyName = localStorage.getItem("pref_profile_company") || "HireTrack";
    const intDateStr = candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString() : "TBD";
    const intTimeStr = candidate.interviewTime || "TBD";
    const jobTitle = candidate.jobId?.title || candidate.roleApplied || "Full Stack Developer";
    const recruiterName = user?.name || "Recruiter";

    return text
      .replace(/\{\{candidateName\}\}/gi, candidate.fullName || "")
      .replace(/\{\{CandidateName\}\}/g, candidate.fullName || "")
      .replace(/\{\{candidateEmail\}\}/gi, candidate.email || "")
      .replace(/\{\{CandidateEmail\}\}/g, candidate.email || "")
      .replace(/\{\{jobRole\}\}/gi, jobTitle)
      .replace(/\{\{RoleApplied\}\}/g, jobTitle)
      .replace(/\{\{company\}\}/gi, companyName)
      .replace(/\{\{interviewDate\}\}/gi, intDateStr)
      .replace(/\{\{interviewTime\}\}/gi, intTimeStr)
      .replace(/\{\{recruiterName\}\}/gi, recruiterName)
      .replace(/\{\{RecruiterName\}\}/g, recruiterName);
  };

  // Select Email Outreach Template
  const handleTemplateChange = (e) => {
    const tempId = e.target.value;
    setSelectedTemplateId(tempId);
    if (!tempId) {
      setEmailSubject("");
      setEmailBody("");
      return;
    }
    const allTemplates = [...PREDEFINED_TEMPLATES, ...templates];
    const temp = allTemplates.find((t) => t._id === tempId);
    if (temp) {
      setEmailSubject(temp.subject);
      setEmailBody(temp.body);
    }
  };

  // Send Email outreach campaign
  const handleSendEmail = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!emailSubject || !emailBody) return;
    try {
      setSendingEmail(true);

      const replacedSubject = replaceTemplateVariables(emailSubject);
      const replacedBody = replaceTemplateVariables(emailBody);

      // Build FormData payload
      const formData = new FormData();
      formData.append("candidateIds", JSON.stringify([candidate._id]));
      formData.append("subject", replacedSubject);
      formData.append("message", replacedBody);

      if (selectedAttachments.length > 0) {
        formData.append("existingAttachments", JSON.stringify(selectedAttachments));
      }

      if (newAttachmentFile) {
        formData.append("attachments", newAttachmentFile);
      }

      await candidateService.bulkEmail([candidate._id], replacedSubject, replacedBody, formData);
      toast.success("✓ Email Sent Successfully");
      setShowEmailModal(false);
      setIsPreviewMode(false);
      setSelectedAttachments([]);
      setNewAttachmentFile(null);
      fetchCandidateDetails();
    } catch (error) {
      console.error(error);
      toast.error("✕ Failed to Send Email");
    } finally {
      setSendingEmail(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Applied":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "Screening":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "Shortlisted":
        return "bg-teal-500/10 text-teal-400 border border-teal-500/20";
      case "Interview":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "Selected":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Rejected":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      default:
        return "bg-slate-800 text-slate-400 border border-slate-700";
    }
  };

  const getRecommendBadge = (level) => {
    switch (level) {
      case "Strongly Recommended":
        return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
      case "Recommended":
        return "bg-teal-500/15 text-teal-400 border border-teal-500/30";
      case "Consider":
        return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
      case "Not Recommended":
        return "bg-rose-500/15 text-rose-400 border border-rose-500/30";
      default:
        return "bg-slate-800/40 text-slate-400 border border-slate-700";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/25";
    if (score >= 60) return "text-amber-400 border-amber-500/25";
    return "text-rose-400 border-rose-500/25";
  };

  if (loading) return <Loader />;
  if (!candidate) return <div className="text-center py-20 text-slate-400">Candidate not found.</div>;

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto pb-10 print:bg-white print:text-black">
      
      {/* Page Header toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/candidates")}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pipeline</span>
        </div>

        {/* Action Panel Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {user?.role !== "Interviewer" && (
            <>
              <button
                onClick={() => setShowEmailModal(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
              >
                Send Email
              </button>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
              >
                Schedule Interview
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Edit
              </button>
              <button
                onClick={handleArchiveToggle}
                className="px-4 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/20 text-blue-400 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                {candidate.isArchived ? "Restore" : "Archive"}
              </button>
              {(user?.role === "Admin" || user?.role === "HR") && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Candidate Info Header */}
      <div className="p-6 rounded-2xl border border-slate-850 bg-slate-900/40 backdrop-blur-sm shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{candidate.fullName}</h1>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusBadge(candidate.status)}`}>
              {candidate.status}
            </span>
            {candidate.isArchived && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                Archived
              </span>
            )}
          </div>
          <p className="text-blue-400 text-base font-semibold">
            {candidate.jobId?.title || candidate.roleApplied}
          </p>
        </div>

        {/* Match score progress circle */}
        {candidate.matchScore > 0 && (
          <div className="flex items-center gap-4 bg-slate-950/40 border border-slate-850 p-4 rounded-2xl">
            <div className="relative h-14 w-14 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-500"
                  strokeDasharray={`${candidate.matchScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-sm font-extrabold text-white">{candidate.matchScore}%</span>
            </div>
            <div className="space-y-0.5">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Match Matchmaker</div>
              {candidate.aiRecommendation?.level && (
                <span className={`inline-block text-[9px] px-2 py-0.5 rounded font-bold border ${getRecommendBadge(candidate.aiRecommendation.level)}`}>
                  {candidate.aiRecommendation.level}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-850 gap-2 print:hidden">
        {["overview", "scorecards", "questions", "documents"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === tab
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Contact Details & Info Card */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Contact Information */}
              <div className="p-5 rounded-2xl border border-slate-850 bg-slate-900/40 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">
                  Contact Information
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Email:</span>
                    <a href={`mailto:${candidate.email}`} className="text-blue-400 font-bold hover:underline">
                      {candidate.email}
                    </a>
                  </div>
                  <div className="flex justify-between border-t border-slate-900 pt-2">
                    <span className="text-slate-500 font-semibold">Phone:</span>
                    <a href={`tel:${candidate.phone}`} className="text-slate-300 font-bold">
                      {candidate.phone}
                    </a>
                  </div>
                  <div className="flex justify-between border-t border-slate-900 pt-2">
                    <span className="text-slate-500 font-semibold">Location:</span>
                    <span className="text-slate-300 font-semibold">{candidate.currentLocation || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-900 pt-2">
                    <span className="text-slate-500 font-semibold">LinkedIn:</span>
                    {candidate.linkedinUrl ? (
                      <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 font-bold hover:underline">
                        Profile Link
                      </a>
                    ) : (
                      <span className="text-slate-500 italic">None</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Recruitment context card */}
              <div className="p-5 rounded-2xl border border-slate-850 bg-slate-900/40 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">
                  Job details
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Experience:</span>
                    <span className="text-slate-300 font-semibold">{candidate.experience || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-900 pt-2">
                    <span className="text-slate-500 font-semibold">Company:</span>
                    <span className="text-slate-300 font-semibold">{candidate.currentCompany || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-900 pt-2">
                    <span className="text-slate-500 font-semibold">Source:</span>
                    <span className="text-slate-300 font-semibold">{candidate.source || "Organic"}</span>
                  </div>
                  {user?.role !== "Interviewer" && (
                    <div className="flex justify-between border-t border-slate-900 pt-2">
                      <span className="text-slate-500 font-semibold">Expected Salary:</span>
                      <span className="text-slate-300 font-semibold">{candidate.expectedSalary || "N/A"}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-900 pt-2">
                    <span className="text-slate-500 font-semibold">Notice Period:</span>
                    <span className="text-slate-300 font-semibold">{candidate.noticePeriod || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Summaries & Match Score cards */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* AI Professional Summary */}
              {candidate.aiSummary?.textSummary && (
                <div className="p-6 rounded-2xl border border-slate-850 bg-slate-900/40 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-850">
                    <span className="p-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">AI Professional Summary</h3>
                  </div>

                  <p className="text-slate-300 text-sm leading-relaxed italic">
                    "{candidate.aiSummary.textSummary}"
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Suitable Roles */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Suitable Roles</span>
                      <div className="flex flex-wrap gap-1">
                        {candidate.aiSummary.suitableRoles?.map((r, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-950/60 text-slate-300 border border-slate-850">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Career Highlights */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Career Highlights</span>
                      <ul className="list-disc pl-4 text-xs text-slate-400 space-y-1.5">
                        {candidate.aiSummary.careerHighlights?.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Recommendation Explanation Card */}
              {candidate.aiRecommendation?.explanation && (
                <div className="p-6 rounded-2xl border border-slate-850 bg-slate-900/40 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </span>
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">AI Selection Recommendation</h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRecommendBadge(candidate.aiRecommendation.level)}`}>
                      {candidate.aiRecommendation.level}
                    </span>
                  </div>

                  <p className="text-slate-300 text-sm leading-relaxed">
                    {candidate.aiRecommendation.explanation}
                  </p>

                  {/* Matching/Missing Skills Lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Matching Required Skills</span>
                      <div className="flex flex-wrap gap-1">
                        {candidate.matchingSkills?.length > 0 ? (
                          candidate.matchingSkills.map((s, i) => (
                            <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic">None logged</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Missing Preferred Skills</span>
                      <div className="flex flex-wrap gap-1">
                        {candidate.missingSkills?.length > 0 ? (
                          candidate.missingSkills.map((s, i) => (
                            <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic">None logged</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Suggestions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">AI Strengths</span>
                      <ul className="list-disc pl-4 text-xs text-slate-400 space-y-1">
                        {candidate.strengths?.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">AI Suggestions</span>
                      <ul className="list-disc pl-4 text-xs text-slate-400 space-y-1">
                        {candidate.suggestions?.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recruiter Activity Trail & Note history logs */}
          {user?.role !== "Interviewer" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Notes history adder */}
              <div className="lg:col-span-1 bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">Log Recruiter Note</h3>
                <form onSubmit={handleAddNoteSubmit} className="space-y-3">
                  <textarea
                    rows="4"
                    required
                    placeholder="Record interview notes or candidate screening summaries..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-200 text-xs focus:outline-none focus:border-blue-500/50 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={noteSubmitting || !noteText.trim()}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer shadow-md"
                  >
                    {noteSubmitting ? "Logging Note..." : "Add Recruiter Note"}
                  </button>
                </form>
              </div>

              {/* Timeline Audit Logs */}
              <div className="lg:col-span-1 bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">Activity Timeline</h3>
                {candidate.activityTimeline && candidate.activityTimeline.length > 0 ? (
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1.5 custom-scrollbar">
                    {[...candidate.activityTimeline].reverse().map((evt, index) => (
                      <div key={index} className="p-3 rounded-xl border border-slate-900 bg-slate-950/30 text-xs space-y-1 relative">
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase">
                          <span>{evt.type.replace(/_/g, " ")}</span>
                          <span>{new Date(evt.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-300 font-medium">{evt.message}</p>
                        {evt.performedBy && (
                          <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                            By: {evt.performedBy}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No events logged.</p>
                )}
              </div>

              {/* Note logs list */}
              <div className="lg:col-span-1 bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">Notes History</h3>
                {candidate.notesHistory && candidate.notesHistory.length > 0 ? (
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1.5 custom-scrollbar">
                    {[...candidate.notesHistory].reverse().map((note) => (
                      <div key={note._id} className="p-3 rounded-xl border border-slate-900 bg-slate-950/30 text-xs space-y-1.5 relative group">
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase">
                          <span>By {note.author || "Recruiter"}</span>
                          <div className="flex items-center gap-2">
                            <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                            {editingNoteId !== note._id && (
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEditNoteStart(note)}
                                  className="text-slate-400 hover:text-blue-400 cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteNote(note._id)}
                                  className="text-slate-400 hover:text-red-400 cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {editingNoteId === note._id ? (
                          <div className="space-y-2 mt-2">
                            <textarea
                              value={editingNoteText}
                              onChange={(e) => setEditingNoteText(e.target.value)}
                              className="w-full p-2 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none resize-none"
                              rows="2"
                            />
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => setEditingNoteId(null)}
                                className="px-2 py-0.5 rounded bg-slate-950 text-[9px] text-slate-400 hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleEditNoteSubmit(note._id)}
                                className="px-2 py-0.5 rounded bg-blue-600 text-[9px] text-white font-bold"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-300 leading-normal">{note.text}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No notes logged.</p>
                )}
              </div>
              {/* Email History card */}
              <div className="lg:col-span-2 bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">Email Outreach History</h3>
                {candidate.emailHistory && candidate.emailHistory.length > 0 ? (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
                    {[...candidate.emailHistory].reverse().map((email, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-900 bg-slate-950/30 text-xs space-y-2 relative">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase">
                          <span>Recipient: {email.recipient}</span>
                          <div className="flex items-center gap-2">
                            <span>{new Date(email.sentAt).toLocaleString()}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                              email.status === "Success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}>
                              {email.status}
                            </span>
                          </div>
                        </div>
                        <div className="font-semibold text-white">Subject: {email.subject}</div>
                        <p className="text-slate-300 whitespace-pre-line leading-relaxed bg-slate-950/20 p-2.5 rounded border border-slate-900/50">{email.body}</p>
                        {email.attachments && email.attachments.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-slate-900/50">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Attachments:</span>
                            {email.attachments.map((filename, aIdx) => (
                              <span key={aIdx} className="text-[9px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                                {filename}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-[9px] text-slate-500 font-bold uppercase pt-1">
                          Sent By: {email.recruiter}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No emails sent yet.</p>
                )}
              </div>
            </div>
          )}

          {user?.role === "Interviewer" && (
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-6">
              <div className="border-b border-slate-850 pb-3">
                <h3 className="text-lg font-bold text-white">Log Interview Evaluation Feedback</h3>
                <p className="text-xs text-slate-500 mt-0.5">Evaluate candidate metrics, rating, and overall hiring recommendation</p>
              </div>

              <form onSubmit={handleFeedbackSubmitInterviewer} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Candidate Rating</label>
                    <select
                      value={feedbackRating}
                      onChange={(e) => setFeedbackRating(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-300 text-xs focus:outline-none focus:border-blue-500/50 cursor-pointer"
                    >
                      <option value="">Select Rating (1-5)</option>
                      <option value="1">1 - Poor</option>
                      <option value="2">2 - Fair</option>
                      <option value="3">3 - Good</option>
                      <option value="4">4 - Very Good</option>
                      <option value="5">5 - Excellent</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Decision Recommendation</label>
                    <select
                      value={feedbackDecision}
                      onChange={(e) => setFeedbackDecision(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-300 text-xs focus:outline-none focus:border-blue-500/50 cursor-pointer"
                    >
                      <option value="">Select Decision</option>
                      <option value="Move Forward">Move Forward</option>
                      <option value="Hold">Hold</option>
                      <option value="Reject">Reject</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Interview Status</label>
                    <select
                      value={feedbackStatus}
                      onChange={(e) => setFeedbackStatus(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-300 text-xs focus:outline-none focus:border-blue-500/50 cursor-pointer"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Evaluation Notes & Remarks</label>
                  <textarea
                    rows="5"
                    required
                    placeholder="Enter detailed technical feedback, communication review, and specific interview questions comments..."
                    value={feedbackRemarks}
                    onChange={(e) => setFeedbackRemarks(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-200 text-xs focus:outline-none focus:border-blue-500/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={feedbackSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer shadow-md"
                >
                  {feedbackSubmitting ? "Saving..." : "Save Feedback"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Evaluation Scorecards */}
      {activeTab === "scorecards" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Interviewer Evaluations</h3>
            <button
              onClick={() => setShowScorecardModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md"
            >
              Submit Scorecard
            </button>
          </div>

          {scorecards.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-850 bg-slate-900/10 rounded-2xl">
              <p className="text-slate-500 text-sm">No evaluation scorecards submitted yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scorecards.map((card) => (
                <div key={card._id} className="p-5 rounded-2xl border border-slate-850 bg-slate-900/40 space-y-4">
                  <div className="flex justify-between items-start pb-2 border-b border-slate-850">
                    <div>
                      <h4 className="font-bold text-sm text-white">Scorecard Evaluation</h4>
                      <span className="text-[10px] text-slate-500">Submitted by: {card.userId?.name || "Interviewer"} ({card.userId?.role})</span>
                    </div>
                    <span className="text-xs font-extrabold text-blue-400 bg-blue-600/15 border border-blue-500/20 px-2 py-0.5 rounded">
                      {card.overallRecommendation}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Communication:</span>
                      <span className="font-bold text-slate-200">{card.communicationScore}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Technical Skills:</span>
                      <span className="font-bold text-slate-200">{card.technicalScore}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Problem Solving:</span>
                      <span className="font-bold text-slate-200">{card.problemSolvingScore}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Culture Fit:</span>
                      <span className="font-bold text-slate-200">{card.cultureFitScore}/5</span>
                    </div>
                  </div>

                  {card.interviewerComments && (
                    <div className="pt-2 border-t border-slate-900">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Interviewer Feedback Comments</span>
                      <p className="text-xs text-slate-350 italic leading-relaxed">"{card.interviewerComments}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: AI Interview Questions */}
      {activeTab === "questions" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">AI Interview Questions Generator</h3>
              <p className="text-xs text-slate-500 mt-0.5">Generate tailored technical and behavioral questions based on candidate profile and skills</p>
            </div>
            <button
              onClick={handleGenerateQuestions}
              disabled={generatingQuestions}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-40 flex items-center gap-2 shadow-md"
            >
              {generatingQuestions ? "Formulating..." : "Generate AI Questions"}
            </button>
          </div>

          {!candidate.aiInterviewQuestions || Object.keys(candidate.aiInterviewQuestions).every(k => !candidate.aiInterviewQuestions[k]?.length) ? (
            <div className="text-center py-16 border border-dashed border-slate-850 bg-slate-900/10 rounded-2xl">
              <p className="text-slate-500 text-sm">Click the button above to generate tailored interview questions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Technical Questions */}
              {candidate.aiInterviewQuestions.technical?.length > 0 && (
                <div className="p-6 rounded-2xl border border-slate-850 bg-slate-900/40 space-y-3">
                  <h4 className="font-extrabold text-sm text-blue-400 uppercase tracking-wider border-b border-slate-850 pb-2">Technical Core Questions</h4>
                  <ul className="list-decimal pl-4 text-xs text-slate-300 space-y-2.5">
                    {candidate.aiInterviewQuestions.technical.map((q, i) => (
                      <li key={i} className="leading-relaxed">{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Behavioral/HR Questions */}
              {candidate.aiInterviewQuestions.hr?.length > 0 && (
                <div className="p-6 rounded-2xl border border-slate-850 bg-slate-900/40 space-y-3">
                  <h4 className="font-extrabold text-sm text-purple-400 uppercase tracking-wider border-b border-slate-850 pb-2">Behavioral & HR Questions</h4>
                  <ul className="list-decimal pl-4 text-xs text-slate-300 space-y-2.5">
                    {candidate.aiInterviewQuestions.hr.map((q, i) => (
                      <li key={i} className="leading-relaxed">{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Scenario-Based Questions */}
              {candidate.aiInterviewQuestions.scenario?.length > 0 && (
                <div className="p-6 rounded-2xl border border-slate-850 bg-slate-900/40 space-y-3">
                  <h4 className="font-extrabold text-sm text-amber-400 uppercase tracking-wider border-b border-slate-850 pb-2">Scenario-Based Engineering</h4>
                  <ul className="list-decimal pl-4 text-xs text-slate-300 space-y-2.5">
                    {candidate.aiInterviewQuestions.scenario.map((q, i) => (
                      <li key={i} className="leading-relaxed">{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Coding Exercises / Assignments */}
              {candidate.aiInterviewQuestions.coding?.length > 0 && (
                <div className="p-6 rounded-2xl border border-slate-850 bg-slate-900/40 space-y-3">
                  <h4 className="font-extrabold text-sm text-emerald-400 uppercase tracking-wider border-b border-slate-850 pb-2">Coding / Design Exercises</h4>
                  <ul className="list-decimal pl-4 text-xs text-slate-300 space-y-2.5">
                    {candidate.aiInterviewQuestions.coding.map((q, i) => (
                      <li key={i} className="leading-relaxed">{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Documents Manager */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white">Application Documents</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Resume Document Card */}
            <div className="p-5 rounded-2xl border border-slate-850 bg-slate-900/40 flex flex-col justify-between h-44">
              <div>
                <h4 className="font-bold text-sm text-white mb-1">Resume Document</h4>
                <p className="text-[10px] text-slate-500">Securely hosted on Cloudinary</p>
                {candidate.resumeFileName && (
                  <p className="text-xs text-slate-400 font-semibold mt-2 truncate">{candidate.resumeFileName}</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-900/60 mt-auto flex gap-2">
                {candidate.resumeUrl ? (
                  <button
                    onClick={() => { handlePreviewFile(candidate.resumeUrl, candidate.resumeFileName || "Resume"); }}
                    className="flex-1 text-center py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Preview PDF
                  </button>
                ) : (
                  <span className="text-xs text-slate-600 italic">No resume uploaded</span>
                )}
              </div>
            </div>

            {/* Cover Letter Document Card */}
            <div className="p-5 rounded-2xl border border-slate-850 bg-slate-900/40 flex flex-col justify-between h-44">
              <div>
                <h4 className="font-bold text-sm text-white mb-1">Cover Letter</h4>
                <p className="text-[10px] text-slate-500">Securely hosted on Cloudinary</p>
                {candidate.coverLetterUrl && (
                  <p className="text-xs text-slate-400 font-semibold mt-2 truncate">cover_letter.pdf</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-900/60 mt-auto flex gap-2">
                {candidate.coverLetterUrl ? (
                  <button
                    onClick={() => { handlePreviewFile(candidate.coverLetterUrl, "Cover Letter"); }}
                    className="flex-1 text-center py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Preview PDF
                  </button>
                ) : (
                  <span className="text-xs text-slate-600 italic">No cover letter uploaded</span>
                )}
              </div>
            </div>

            {/* Certificate list Card */}
            <div className="p-5 rounded-2xl border border-slate-850 bg-slate-900/40 flex flex-col justify-between h-44">
              <div>
                <h4 className="font-bold text-sm text-white mb-1">Certificates / Attachments</h4>
                <p className="text-[10px] text-slate-500">Securely hosted on Cloudinary</p>
                {candidate.certificates?.length > 0 && (
                  <p className="text-xs text-slate-400 font-semibold mt-2">{candidate.certificates.length} Attachment(s)</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-900/60 mt-auto flex flex-col gap-2.5 max-h-[80px] overflow-y-auto custom-scrollbar">
                {candidate.certificates && candidate.certificates.length > 0 ? (
                  candidate.certificates.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => { handlePreviewFile(c.url, c.name); }}
                      className="text-left text-[10px] font-semibold text-blue-400 hover:text-blue-300 hover:underline truncate block"
                    >
                      {c.name}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-600 italic">No certificates attached</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roster list of Scheduled Interview Rounds History */}
      {candidate.interviews?.length > 0 && (
        <div className="p-6 rounded-2xl border border-slate-850 bg-slate-900/40 backdrop-blur-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">
            Scheduled Interview History Log
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase">
                  <th className="pb-3 pr-4">Round</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Time</th>
                  <th className="pb-3 pr-4">Format</th>
                  <th className="pb-3 pr-4">Interviewer</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40 text-slate-300">
                {candidate.interviews.map((int, i) => (
                  <tr key={i} className="hover:bg-slate-950/15">
                    <td className="py-2.5 pr-4 font-bold text-white">{int.notes || `Round ${i + 1}`}</td>
                    <td className="py-2.5 pr-4">{new Date(int.date).toLocaleDateString()}</td>
                    <td className="py-2.5 pr-4">{int.time}</td>
                    <td className="py-2.5 pr-4">{int.type}</td>
                    <td className="py-2.5 pr-4">{int.interviewer || "Unassigned"}</td>
                    <td className="py-2.5 text-right font-semibold text-blue-400">{int.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Candidate Profile Dialog Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn print:hidden">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-4xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Edit Candidate Details</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <CandidateForm
                initialData={candidate}
                onSubmit={handleUpdate}
                onCancel={() => setShowEditModal(false)}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal Dialog */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn print:hidden">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-md shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Schedule Interview Round</h2>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Interview Date *</label>
                  <input
                    type="date"
                    required
                    value={scheduleData.interviewDate}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, interviewDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Time Slot *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2:30 PM"
                    value={scheduleData.interviewTime}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, interviewTime: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Format</label>
                  <select
                    value={scheduleData.interviewMode}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, interviewMode: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Phone">Phone</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Round Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Technical Round 1"
                    value={scheduleData.interviewRound}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, interviewRound: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Interviewer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sandra Bullock"
                  value={scheduleData.interviewerName}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, interviewerName: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulerSubmitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 disabled:opacity-40"
                >
                  {schedulerSubmitting ? "Scheduling..." : "Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evaluate Scorecard Modal dialog */}
      {showScorecardModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn print:hidden">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-md shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Submit Interview Scorecard</h2>
              <button onClick={() => setShowScorecardModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleScorecardSubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Communication (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={commScore}
                    onChange={(e) => setCommScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Technical skills (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={techScore}
                    onChange={(e) => setTechScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Problem Solving (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={problemScore}
                    onChange={(e) => setProblemScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Culture Fit (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={cultureScore}
                    onChange={(e) => setCultureScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase">Hiring Recommendation</label>
                <select
                  value={recVal}
                  onChange={(e) => setRecVal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300"
                >
                  <option value="Strong Hire">Strong Hire</option>
                  <option value="Hire">Hire</option>
                  <option value="Hold">Hold</option>
                  <option value="Reject">Reject</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase">Comments & Feedback</label>
                <textarea
                  rows="3"
                  value={scorecardComments}
                  onChange={(e) => setScorecardComments(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 resize-none"
                  placeholder="Detail candidate's strengths and core areas of improvements..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowScorecardModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scorecardSubmitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 disabled:opacity-40"
                >
                  {scorecardSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Outreach Modal dialog */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn print:hidden">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-lg shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">
                {isPreviewMode ? "Preview Outreach Email" : "Outreach Outreach Email"}
              </h2>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setIsPreviewMode(false);
                  setSelectedAttachments([]);
                  setNewAttachmentFile(null);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {!isPreviewMode ? (
              <form onSubmit={(e) => { e.preventDefault(); setIsPreviewMode(true); }} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Select Template</label>
                  <select
                    value={selectedTemplateId}
                    onChange={handleTemplateChange}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-350"
                  >
                    <option value="">Blank Outreach Draft</option>
                    {PREDEFINED_TEMPLATES.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} (Predefined)
                      </option>
                    ))}
                    {templates.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Schedule Interview confirmation"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Content *</label>
                  <textarea
                    rows="6"
                    required
                    placeholder="Email text..."
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 resize-none"
                  />
                </div>

                {/* Attachments Selection */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Attach Candidate Documents
                  </label>
                  <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-850 text-xs">
                    {candidate.resumeUrl && (
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAttachments.some(a => a.path === candidate.resumeUrl)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAttachments(prev => [...prev, { filename: candidate.resumeFileName || "Resume.pdf", path: candidate.resumeUrl }]);
                            } else {
                              setSelectedAttachments(prev => prev.filter(a => a.path !== candidate.resumeUrl));
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Resume ({candidate.resumeFileName || "pdf"})</span>
                      </label>
                    )}
                    {candidate.coverLetterUrl && (
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAttachments.some(a => a.path === candidate.coverLetterUrl)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAttachments(prev => [...prev, { filename: "CoverLetter.pdf", path: candidate.coverLetterUrl }]);
                            } else {
                              setSelectedAttachments(prev => prev.filter(a => a.path !== candidate.coverLetterUrl));
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Cover Letter</span>
                      </label>
                    )}
                    {candidate.certificates && candidate.certificates.map((c, cIdx) => (
                      <label key={cIdx} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAttachments.some(a => a.path === c.url)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAttachments(prev => [...prev, { filename: c.name || `Certificate_${cIdx + 1}`, path: c.url }]);
                            } else {
                              setSelectedAttachments(prev => prev.filter(a => a.path !== c.url));
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>{c.name || `Certificate ${cIdx + 1}`}</span>
                      </label>
                    ))}
                    
                    <div className="pt-2 border-t border-slate-900/60 space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Attach New File</span>
                      <input
                        type="file"
                        onChange={(e) => setNewAttachmentFile(e.target.files[0])}
                        className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-blue-600/20 file:text-blue-400 file:cursor-pointer hover:file:bg-blue-600/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailModal(false);
                      setIsPreviewMode(false);
                      setSelectedAttachments([]);
                      setNewAttachmentFile(null);
                    }}
                    className="px-4 py-2 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
                  >
                    Preview Outreach
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3 text-xs text-slate-350">
                  <div>
                    <span className="font-bold text-slate-500 block uppercase text-[9px] tracking-wider">Recipient:</span>
                    <span className="text-white font-medium">{candidate.email}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block uppercase text-[9px] tracking-wider">Subject:</span>
                    <span className="text-white font-semibold">{replaceTemplateVariables(emailSubject)}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block uppercase text-[9px] tracking-wider mb-1">Email Body:</span>
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900 text-slate-300 whitespace-pre-line leading-relaxed">
                      {replaceTemplateVariables(emailBody)}
                    </div>
                  </div>
                  {(selectedAttachments.length > 0 || newAttachmentFile) && (
                    <div>
                      <span className="font-bold text-slate-500 block uppercase text-[9px] tracking-wider mb-1">Attachments:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedAttachments.map((att, aIdx) => (
                          <span key={aIdx} className="px-2 py-0.5 rounded bg-slate-900 text-slate-450 border border-slate-850 text-[10px]">
                            {att.filename}
                          </span>
                        ))}
                        {newAttachmentFile && (
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">
                            {newAttachmentFile.name} (New)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setIsPreviewMode(false)}
                    className="px-4 py-2 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Edit Draft
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={sendingEmail}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    {sendingEmail ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : "Confirm Send"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PDF Document Preview Modal */}
      {previewFileUrl && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn print:hidden">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-4xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
              <h3 className="font-bold text-sm text-white">Document Preview: {previewFileName}</h3>
              <button
                onClick={() => { setPreviewFileUrl(""); setPreviewFileName(""); }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-950/10">
              {previewFileUrl === "ERROR_NOT_FOUND" ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-450 w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-650 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm font-semibold">
                    {previewFileName.toLowerCase().includes("resume") ? "Resume not available" : "Certificate not available"}
                  </span>
                </div>
              ) : previewFileUrl && /\.(png|jpe?g|gif|webp)$/i.test(previewFileUrl.split("?")[0]) ? (
                <img
                  src={previewFileUrl}
                  alt={previewFileName}
                  className="max-h-[550px] max-w-full object-contain rounded-xl border border-slate-800"
                />
              ) : (
                <iframe
                  src={previewFileUrl}
                  title="Document Viewer Preview"
                  width="100%"
                  height="550px"
                  className="rounded-xl border border-slate-850 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDetails;
