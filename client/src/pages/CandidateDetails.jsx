import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import candidateService from "../services/candidateService";
import authService from "../services/authService";
import templateService from "../services/templateService";
import Loader from "../components/Loader";
import CandidateForm from "../components/CandidateForm";

const CandidateDetails = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Note log states
  const [noteText, setNoteText] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Resume attachment states
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Interview Decision/Rating outcome states
  const [decision, setDecision] = useState("");
  const [rating, setRating] = useState(3);
  const [interviewerFeedbackText, setInterviewerFeedbackText] = useState("");
  const [outcomeSubmitting, setOutcomeSubmitting] = useState(false);

  // Evaluation Scorecard states
  const [scorecards, setScorecards] = useState([]);
  const [commScore, setCommScore] = useState(3);
  const [techScore, setTechScore] = useState(3);
  const [problemScore, setProblemScore] = useState(3);
  const [cultureScore, setCultureScore] = useState(3);
  const [recVal, setRecVal] = useState("Hire");
  const [scorecardComments, setScorecardComments] = useState("");
  const [scorecardSubmitting, setScorecardSubmitting] = useState(false);
  const [showScorecardModal, setShowScorecardModal] = useState(false);

  // Recruiter Note editing/deleting states
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState("");

  // Mentions autocomplete states
  const [recruitersList, setRecruitersList] = useState([]);
  const [showMentionsDropdown, setShowMentionsDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);

  // Email template states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateSubject, setNewTemplateSubject] = useState("");
  const [newTemplateBody, setNewTemplateBody] = useState("");

  const fetchCandidateDetails = async () => {
    try {
      setLoading(true);
      const data = await candidateService.getCandidateById(id);
      setCandidate(data);
      try {
        const cards = await candidateService.getCandidateScorecards(id);
        setScorecards(cards);
      } catch (err) {
        console.error("Fetch Scorecards Error:", err);
      }
    } catch (error) {
      console.error("Fetch Candidate Details Error:", error);
      toast.error("Failed to load candidate details");
      navigate("/candidates");
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await templateService.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error("Fetch Templates Error:", err);
    }
  };

  useEffect(() => {
    fetchCandidateDetails();
    const fetchRecruiters = async () => {
      try {
        const users = await authService.getUsers();
        setRecruitersList(users);
      } catch (err) {
        console.error("Fetch Recruiters Error:", err);
      }
    };
    fetchRecruiters();
    fetchTemplates();
  }, [id]);

  useEffect(() => {
    if (candidate) {
      setDecision(candidate.interviewDecision || "");
      setRating(candidate.candidateRating || 3);
      setInterviewerFeedbackText(candidate.interviewerFeedback || "");
    }
  }, [candidate]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to PERMANENTLY delete this candidate? This action cannot be undone.")) {
      try {
        await candidateService.deleteCandidate(id);
        toast.success("Candidate permanently deleted!");
        navigate("/candidates");
      } catch (error) {
        console.error("Delete Candidate Error:", error);
        toast.error("Failed to delete candidate");
      }
    }
  };

  const handleArchiveToggle = async () => {
    try {
      if (candidate.isArchived) {
        await candidateService.restoreCandidate(id);
        toast.success("Candidate restored to active pipeline!");
      } else {
        await candidateService.archiveCandidate(id);
        toast.success("Candidate archived successfully!");
      }
      fetchCandidateDetails();
    } catch (error) {
      console.error("Archive Toggle Error:", error);
      toast.error("Failed to modify archive status");
    }
  };

  const handleUpdate = async (formData, resumeFile) => {
    setIsSubmitting(true);
    try {
      let updated = await candidateService.updateCandidate(id, formData);
      if (resumeFile) {
        const uploadRes = await candidateService.uploadResumeFile(id, resumeFile);
        updated = uploadRes.candidate;
        toast.success("Resume document updated successfully!");
      }
      setCandidate(updated);
      toast.success("Candidate details updated successfully!");
      setShowEditModal(false);
    } catch (error) {
      console.error("Update Candidate Error:", error);
      toast.error("Failed to update candidate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) {
      toast.error("Note text cannot be empty");
      return;
    }

    setNoteSubmitting(true);
    try {
      const updated = await candidateService.addRecruiterNote(id, noteText);
      setCandidate(updated);
      setNoteText("");
      toast.success("Recruiter note added!");
    } catch (error) {
      console.error("Add Note Error:", error);
      const msg = error.response?.data?.message || "Failed to add recruiter note";
      toast.error(msg);
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleNoteChange = (e) => {
    const val = e.target.value;
    setNoteText(val);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAt = textBeforeCursor.lastIndexOf("@");

    if (lastAt !== -1 && lastAt >= textBeforeCursor.length - 15) {
      const query = textBeforeCursor.slice(lastAt + 1);
      if (!query.includes(" ")) {
        setMentionSearch(query);
        setMentionIndex(lastAt);
        setShowMentionsDropdown(true);
        return;
      }
    }
    setShowMentionsDropdown(false);
  };

  const selectMention = (recruiterName) => {
    const before = noteText.slice(0, mentionIndex);
    const after = noteText.slice(mentionIndex + mentionSearch.length + 1);
    setNoteText(`${before}@${recruiterName} ${after}`);
    setShowMentionsDropdown(false);
  };

  const renderNoteText = (text) => {
    if (!text) return "";
    const parts = text.split(/(@[a-zA-Z0-9_\s]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        return (
          <span key={index} className="text-cyan-400 font-bold px-1 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20 text-[10px]">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast.error("Subject and Body are required");
      return;
    }
    setSendingEmail(true);
    try {
      const templateName = selectedTemplateId 
        ? templates.find(t => t._id === selectedTemplateId)?.name || "Custom Outreach"
        : "Custom Outreach";
      const emailLogMessage = `Sent email: "${emailSubject}" using template '${templateName}'`;
      
      const updatedData = {
        ...candidate,
        activityTimeline: [
          ...(candidate.activityTimeline || []),
          {
            type: "email_sent",
            message: emailLogMessage,
            createdAt: new Date(),
          }
        ]
      };
      
      const updated = await candidateService.updateCandidate(id, updatedData);
      setCandidate(updated);
      toast.success("Outreach email dispatched successfully!");
      setShowEmailModal(false);
      setEmailSubject("");
      setEmailBody("");
    } catch (err) {
      console.error("Send Email Error:", err);
      toast.error("Failed to send email outreach");
    } finally {
      setSendingEmail(false);
    }
  };

  const replacePlaceholders = (text, candidateObj) => {
    if (!text || !candidateObj) return text;
    return text
      .replace(/\{\{\s*(candidateName|candidate|name)\s*\}\}/gi, candidateObj.fullName || "")
      .replace(/\{\{\s*(role|position|roleApplied)\s*\}\}/gi, candidateObj.roleApplied || "Open Role")
      .replace(/\{\{\s*email\s*\}\}/gi, candidateObj.email || "")
      .replace(/\{\{\s*phone\s*\}\}/gi, candidateObj.phone || "");
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplateName.trim() || !newTemplateSubject.trim() || !newTemplateBody.trim()) {
      toast.error("All template fields are required");
      return;
    }
    try {
      const created = await templateService.createTemplate({
        name: newTemplateName,
        subject: newTemplateSubject,
        body: newTemplateBody,
      });
      setTemplates((prev) => [created, ...prev]);
      setSelectedTemplateId(created._id);
      setEmailSubject(replacePlaceholders(created.subject, candidate));
      setEmailBody(replacePlaceholders(created.body, candidate));
      setShowCreateTemplateModal(false);
      setNewTemplateName("");
      setNewTemplateSubject("");
      setNewTemplateBody("");
      toast.success("Email template created!");
    } catch (err) {
      console.error("Create Template Error:", err);
      toast.error("Failed to save email template");
    }
  };

  const handleTemplateChange = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setEmailSubject("");
      setEmailBody("");
      return;
    }
    const found = templates.find((t) => t._id === templateId);
    if (found) {
      setEmailSubject(replacePlaceholders(found.subject, candidate));
      setEmailBody(replacePlaceholders(found.body, candidate));
    }
  };

  const handleResumeUploadSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      toast.error("Please select a document file to attach");
      return;
    }

    setUploadingResume(true);
    try {
      const res = await candidateService.uploadResumeFile(id, resumeFile);
      setCandidate(res.candidate);
      setResumeFile(null);
      toast.success("Resume file attached and uploaded successfully!");
    } catch (error) {
      console.error("Resume Upload Error:", error);
      const msg = error.response?.data?.message || "Failed to upload resume file";
      toast.error(msg);
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDownloadResume = async (e) => {
    e.preventDefault();
    if (!candidate?.resumePath) return;
    try {
      const response = await fetch(`http://localhost:5000${candidate.resumePath}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", candidate.resumeFileName || "resume");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Resume downloaded successfully!");
    } catch (err) {
      console.error("Download Error:", err);
      // Fallback: open in new tab
      window.open(`http://localhost:5000${candidate.resumePath}`, "_blank");
    }
  };

  const handleOutcomeSubmit = async (e) => {
    e.preventDefault();
    setOutcomeSubmitting(true);
    try {
      const updated = await candidateService.updateCandidate(id, {
        ...candidate,
        interviewDecision: decision,
        candidateRating: rating,
        interviewerFeedback: interviewerFeedbackText,
      });
      setCandidate(updated);
      toast.success("Interview outcome workflow saved!");
    } catch (error) {
      console.error("Save Outcome Error:", error);
      toast.error("Failed to save interview outcome decision");
    } finally {
      setOutcomeSubmitting(false);
    }
  };

  const handleScorecardSubmit = async (e) => {
    e.preventDefault();
    setScorecardSubmitting(true);
    try {
      const res = await candidateService.createScorecard(id, {
        communicationScore: commScore,
        technicalScore: techScore,
        problemSolvingScore: problemScore,
        cultureFitScore: cultureScore,
        overallRecommendation: recVal,
        interviewerComments: scorecardComments,
      });
      setScorecards(prev => [res.scorecard, ...prev]);
      setCandidate(res.candidate);
      
      // Reset form
      setCommScore(3);
      setTechScore(3);
      setProblemScore(3);
      setCultureScore(3);
      setRecVal("Hire");
      setScorecardComments("");
      setShowScorecardModal(false);
      
      toast.success("Evaluation scorecard submitted successfully!");
    } catch (error) {
      console.error("Scorecard Submit Error:", error);
      toast.error("Failed to submit scorecard evaluation");
    } finally {
      setScorecardSubmitting(false);
    }
  };

  const handleEditNoteStart = (note) => {
    setEditingNoteId(note._id);
    setEditingNoteText(note.text);
  };

  const handleEditNoteSubmit = async (noteId) => {
    if (!editingNoteText.trim()) {
      toast.error("Note text cannot be empty");
      return;
    }
    try {
      const updated = await candidateService.editRecruiterNote(id, noteId, editingNoteText);
      setCandidate(updated);
      setEditingNoteId(null);
      setEditingNoteText("");
      toast.success("Recruiter note updated successfully!");
    } catch (err) {
      console.error("Edit Note Error:", err);
      toast.error("Failed to update recruiter note");
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this recruiter note?")) return;
    try {
      const updated = await candidateService.deleteRecruiterNote(id, noteId);
      setCandidate(updated);
      toast.success("Recruiter note deleted successfully!");
    } catch (err) {
      console.error("Delete Note Error:", err);
      toast.error("Failed to delete recruiter note");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Applied":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "Screening":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "Interview":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "Selected":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Rejected":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      default:
        return "bg-slate-800 text-slate-400";
    }
  };

  const getEventStyle = (type) => {
    switch (type) {
      case "candidate_created":
        return "bg-blue-500/20 text-blue-400 border-blue-500/25";
      case "status_change":
        return "bg-purple-500/20 text-purple-400 border-purple-500/25";
      case "interview_scheduled":
        return "bg-blue-500/20 text-blue-400 border-blue-500/25";
      case "interview_decision":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/25";
      case "note_added":
        return "bg-slate-800 text-slate-400 border-slate-700";
      case "resume_uploaded":
        return "bg-amber-500/20 text-amber-400 border-amber-500/25";
      case "email_sent":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/25";
      default:
        return "bg-slate-900 text-slate-300 border-slate-800";
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Candidate not found.</p>
        <Link to="/candidates" className="text-blue-400 hover:underline">
          Go back to candidates
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto pb-10">
      {/* Navigation and Action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/candidates")}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Back to Pipeline</span>
        </div>

        <div className="flex items-center gap-3">
          {user?.role !== "Interviewer" && (
            <>
              <button
                onClick={() => setShowEmailModal(true)}
                className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-355 hover:text-white border border-slate-800 transition-all font-semibold text-sm cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Outreach
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-350 hover:text-white border border-slate-800 transition-all font-semibold text-sm cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </button>
              <button
                onClick={handleArchiveToggle}
                className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/10 hover:border-blue-500/20 transition-all font-semibold text-sm cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
                </svg>
                {candidate.isArchived ? "Restore Candidate" : "Archive Candidate"}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-600/20 text-rose-400 hover:text-rose-355 border border-rose-500/10 hover:border-rose-500/20 transition-all font-semibold text-sm cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Permanently
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Info Box */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm shadow-xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{candidate.fullName}</h1>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusBadge(candidate.status)}`}>
                {candidate.status}
              </span>
              {candidate.isArchived && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-bold uppercase tracking-wider">
                  Archived
                </span>
              )}
            </div>
            <p className="text-blue-400 text-lg font-medium">{candidate.roleApplied}</p>
          </div>
          <div className="text-xs text-slate-500 text-left md:text-right space-y-1">
            <p>Applied Date: <span className="font-semibold text-slate-300">{new Date(candidate.createdAt).toLocaleDateString()}</span></p>
            <p>Last Activity: <span className="font-semibold text-slate-300">{new Date(candidate.updatedAt).toLocaleString()}</span></p>
          </div>
        </div>

        {/* Contact and Professional Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Details */}
          <div className="space-y-4 bg-slate-950/20 border border-slate-850 p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">
              Contact Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Email:</span>
                <a href={`mailto:${candidate.email}`} className="text-blue-400 hover:underline font-semibold">
                  {candidate.email}
                </a>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-850/40">
                <span className="text-slate-500 font-medium">Phone:</span>
                <a href={`tel:${candidate.phone}`} className="text-slate-300 font-semibold hover:text-blue-400">
                  {candidate.phone}
                </a>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-850/40">
                <span className="text-slate-500 font-medium">Location:</span>
                <span className="text-slate-300 font-semibold">{candidate.currentLocation || "Not specified"}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-850/40">
                <span className="text-slate-500 font-medium">LinkedIn:</span>
                {candidate.linkedinUrl ? (
                  <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline font-semibold flex items-center gap-1">
                    LinkedIn Profile
                  </a>
                ) : (
                  <span className="text-slate-500 italic">None</span>
                )}
              </div>
              <div className="flex flex-col py-1 border-t border-slate-850/40 gap-1.5">
                <span className="text-slate-500 font-medium text-xs">Resume Attachment:</span>
                {candidate.resumeFileName ? (
                  <div className="flex flex-col gap-2 bg-slate-950/40 p-3 rounded-lg border border-slate-850/60 mt-1">
                    <span className="text-slate-300 text-xs font-semibold truncate">{candidate.resumeFileName}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={`http://localhost:5000${candidate.resumePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/30 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Resume
                      </a>
                      <button
                        onClick={handleDownloadResume}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-350 border border-slate-800 hover:border-slate-700 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                    </div>
                  </div>
                ) : candidate.resumeUrl ? (
                  <div className="flex items-center gap-2 mt-1">
                    <a
                      href={candidate.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/30 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open Resume Link
                    </a>
                  </div>
                ) : (
                  <span className="text-slate-500 italic text-xs mt-1 block">No resume uploaded</span>
                )}
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="space-y-4 bg-slate-950/20 border border-slate-850 p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">
              Professional Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Current Company:</span>
                <span className="text-slate-300 font-semibold">{candidate.currentCompany || "Not specified"}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-850/40">
                <span className="text-slate-500 font-medium">Total Experience:</span>
                <span className="text-slate-300 font-semibold">{candidate.experience || "Not specified"}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-850/40">
                <span className="text-slate-500 font-medium">Expected Salary:</span>
                <span className="text-slate-300 font-semibold">{candidate.expectedSalary || "Not specified"}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-850/40">
                <span className="text-slate-500 font-medium">Notice Period:</span>
                <span className="text-slate-300 font-semibold">{candidate.noticePeriod || "Not specified"}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-850/40">
                <span className="text-slate-500 font-medium">Recruitment Source:</span>
                <span className="text-slate-300 font-semibold">{candidate.source || "Not specified"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* File upload section */}
        <div className="bg-slate-950/20 border border-slate-850 p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Resume / Candidate Documents Upload
          </h3>
          <form onSubmit={handleResumeUploadSubmit} className="flex flex-col sm:flex-row gap-3 items-center">
            <input
              type="file"
              onChange={(e) => setResumeFile(e.target.files[0])}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-slate-300 hover:file:bg-slate-800 file:cursor-pointer"
            />
            <button
              type="submit"
              disabled={uploadingResume}
              className="w-full sm:w-auto px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {uploadingResume ? "Uploading..." : "Attach Document"}
            </button>
          </form>
        </div>

        {/* Technical skills and Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Technical Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills && candidate.skills.length > 0 ? (
                  candidate.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded bg-blue-500/5 text-blue-350 border border-blue-500/10 text-[10px] font-bold uppercase tracking-wider"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-505 italic">No skills specified</span>
                )}
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-xs font-bold text-slate-505 uppercase tracking-wider mb-2">Candidate Notes Summary</h3>
              <p className="text-slate-300 text-xs bg-slate-950/20 border border-slate-855 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                {candidate.notes || "No notes summary provided."}
              </p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4 bg-blue-500/5 border border-blue-500/15 p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/15 pb-2 flex items-center gap-1.5">
              Interview Schedule
            </h3>
            {candidate.interviewDate ? (
              <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-sm">
                <div>
                  <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Interview Date</span>
                  <span className="text-slate-200 font-bold text-base mt-0.5 block">
                    {new Date(candidate.interviewDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Interview Time</span>
                  <span className="text-slate-200 font-bold text-base mt-0.5 block">{candidate.interviewTime || "Not specified"}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Meeting Mode</span>
                  <span className="text-slate-200 font-bold mt-0.5 block">{candidate.interviewMode || "Not specified"}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-505 font-semibold uppercase tracking-wider">Interview Round</span>
                  <span className="text-slate-200 font-bold mt-0.5 block">{candidate.interviewRound || "Not specified"}</span>
                </div>
                <div className="col-span-2 border-t border-slate-800/60 pt-3">
                  <span className="block text-[10px] text-slate-505 font-semibold uppercase tracking-wider">Assigned Interviewer</span>
                  <span className="text-blue-400 font-bold mt-0.5 block">{candidate.interviewerName || "Not assigned"}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-505 text-xs italic">
                No interview scheduled. Click Edit Profile to schedule a session.
              </div>
            )}
          </div>
        </div>

        {/* Outcomes & Scorecards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Interview Outcome & Decisions */}
          <div className="bg-slate-955/40 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-slate-855 pb-2">
              Interview Outcome & Decisions
            </h3>
            <form onSubmit={handleOutcomeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rating Evaluation</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 cursor-pointer"
                  >
                    <option value={5}>5 - Excellent Fit (Strong)</option>
                    <option value={4}>4 - Good fit (Moderate)</option>
                    <option value={3}>3 - Acceptable (Average)</option>
                    <option value={2}>2 - Weak fit</option>
                    <option value={1}>1 - Poor fit (Weak)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Decision Outcomes</label>
                  <select
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 cursor-pointer"
                  >
                    <option value="">No Decision Selected</option>
                    <option value="Move Forward">Move Forward</option>
                    <option value="Hold">Hold</option>
                    <option value="Reject">Reject</option>
                    <option value="Selected">Selected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Interviewer remarks & Evaluation Feedback</label>
                <textarea
                  value={interviewerFeedbackText}
                  onChange={(e) => setInterviewerFeedbackText(e.target.value)}
                  placeholder="Log interviewer rating details, decision remarks, or final coding evaluation notes..."
                  rows="3"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={outcomeSubmitting}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
              >
                {outcomeSubmitting ? "Saving Outcome..." : "Submit Decision Outcome"}
              </button>
            </form>
          </div>

          {/* Evaluations & Scorecards History */}
          <div className="bg-slate-955/40 border border-slate-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-slate-855 pb-2">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Recruiter Scorecards History
                </h3>
                <button
                  onClick={() => setShowScorecardModal(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Create Scorecard
                </button>
              </div>

              <div className="mt-4 space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                {scorecards.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs italic">
                    No scorecard evaluations logged for this candidate.
                  </div>
                ) : (
                  scorecards.map((card) => (
                    <div key={card._id} className="p-3.5 rounded-xl border border-slate-850 bg-slate-900/30 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                        <span className={`px-2 py-0.5 rounded ${
                          card.overallRecommendation === "Strong Hire" ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/20" :
                          card.overallRecommendation === "Hire" ? "bg-blue-950/80 text-blue-400 border border-blue-500/20" :
                          card.overallRecommendation === "Hold" ? "bg-amber-955/80 text-amber-400 border border-amber-500/20" :
                          "bg-rose-955/80 text-rose-400 border border-rose-500/20"
                        }`}>
                          {card.overallRecommendation}
                        </span>
                        <span className="text-slate-505 font-bold">{new Date(card.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="bg-slate-950/30 p-1.5 rounded border border-slate-850/40">
                          <div className="text-[9px] text-slate-500 font-bold uppercase">COMM</div>
                          <div className="text-white font-bold mt-0.5">{card.communicationScore}/5</div>
                        </div>
                        <div className="bg-slate-950/30 p-1.5 rounded border border-slate-850/40">
                          <div className="text-[9px] text-slate-500 font-bold uppercase">TECH</div>
                          <div className="text-white font-bold mt-0.5">{card.technicalScore}/5</div>
                        </div>
                        <div className="bg-slate-950/30 p-1.5 rounded border border-slate-850/40">
                          <div className="text-[9px] text-slate-500 font-bold uppercase">SOLV</div>
                          <div className="text-white font-bold mt-0.5">{card.problemSolvingScore}/5</div>
                        </div>
                        <div className="bg-slate-950/30 p-1.5 rounded border border-slate-850/40">
                          <div className="text-[9px] text-slate-500 font-bold uppercase">CULT</div>
                          <div className="text-white font-bold mt-0.5">{card.cultureFitScore}/5</div>
                        </div>
                      </div>
                      {card.interviewerComments && (
                        <p className="text-slate-400 text-xs italic line-clamp-2">
                          "{card.interviewerComments}"
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed Section */}
        <div className="border-t border-slate-800/80 pt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Note Input */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Log Recruiter Note</h3>
            <form onSubmit={handleAddNote} className="space-y-3">
              <div className="relative">
                <textarea
                  value={noteText}
                  onChange={handleNoteChange}
                  placeholder="Log feedback, updates, or comments (use @name to mention recruiters)..."
                  rows="4"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-955 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-all duration-200 resize-none"
                ></textarea>

                {showMentionsDropdown && (
                  <div className="absolute left-0 bottom-full mb-1.5 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-32 overflow-y-auto z-20 divide-y divide-slate-850/60 premium-card">
                    {recruitersList
                      .filter((u) => u.name.toLowerCase().includes(mentionSearch.toLowerCase()))
                      .map((u) => (
                        <div
                          key={u._id}
                          onClick={() => selectMention(u.name)}
                          className="px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-950 hover:text-blue-400 cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <span className="font-semibold">{u.name}</span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase">{u.role}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={noteSubmitting}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-md shadow-blue-600/15 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {noteSubmitting ? "Logging..." : "Add Recruiter Note"}
              </button>
            </form>
          </div>

          {/* Activity Timeline List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activity Timeline</h3>
            {candidate.activityTimeline && candidate.activityTimeline.length > 0 ? (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {[...candidate.activityTimeline].reverse().map((event, index) => (
                  <div key={index} className={`p-3.5 rounded-xl border bg-slate-950/20 space-y-1.5 ${getEventStyle(event.type)}`}>
                    <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                      <span>{event.type.replace("_", " ")}</span>
                      <span className="text-slate-500 font-semibold">{new Date(event.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{event.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic py-4">No events logged in the candidate's history.</div>
            )}
          </div>

          {/* Note History List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes History</h3>
            {candidate.notesHistory && candidate.notesHistory.length > 0 ? (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {[...candidate.notesHistory].reverse().map((note) => (
                  <div key={note._id} className="p-4 rounded-xl border border-slate-850 bg-slate-955/25 space-y-2 relative group">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-bold text-blue-400">Recruiter Note</span>
                      <div className="flex items-center gap-2">
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                        {editingNoteId !== note._id && (
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditNoteStart(note)}
                              className="text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                              title="Edit Note"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note._id)}
                              className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete Note"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {editingNoteId === note._id ? (
                      <div className="space-y-2 mt-1">
                        <textarea
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none resize-none"
                          rows="2.5"
                        ></textarea>
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="px-2 py-1 rounded bg-slate-950 text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleEditNoteSubmit(note._id)}
                            className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-[10px] text-white font-bold transition-colors cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{renderNoteText(note.text)}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic py-4">No notes recorded in the candidate's history.</div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Edit Candidate Profile</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
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
      {/* Scorecard Creation Modal */}
      {/* Email Candidate Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col premium-card">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Email Outreach - {candidate.fullName}</h2>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {showCreateTemplateModal ? (
              <form onSubmit={handleCreateTemplate} className="p-6 space-y-4 overflow-y-auto">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Save New Template</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Template Name</label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g., Interview Invitation"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={newTemplateSubject}
                    onChange={(e) => setNewTemplateSubject(e.target.value)}
                    placeholder="Interview schedule for {{role}}"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Body Content</label>
                  <textarea
                    value={newTemplateBody}
                    onChange={(e) => setNewTemplateBody(e.target.value)}
                    placeholder="Hi {{candidateName}}, we would love to schedule an interview..."
                    rows="5"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 resize-none"
                  ></textarea>
                  <span className="text-[10px] text-slate-500 font-medium">Use tags: {"{{candidateName}}"}, {"{{role}}"} to dynamically populate details</span>
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setShowCreateTemplateModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors cursor-pointer"
                  >
                    Save Template
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSendEmail} className="p-6 space-y-4 overflow-y-auto">
                <div className="flex justify-between items-center">
                  <div className="flex-1 mr-3">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Template</label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 cursor-pointer"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="">-- Custom Blank Email --</option>
                      {templates.map((t) => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateTemplateModal(true)}
                    className="mt-5 px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors cursor-pointer"
                  >
                    + New Template
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Subject heading"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Body</label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Draft candidate message here..."
                    rows="6"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 resize-none"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingEmail}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-blue-600/15"
                  >
                    {sendingEmail ? "Dispatching..." : "Send Outreach"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {showScorecardModal && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col premium-card">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Create Evaluation Scorecard</h2>
              <button
                onClick={() => setShowScorecardModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleScorecardSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Communication (1-5)</label>
                  <select
                    value={commScore}
                    onChange={(e) => setCommScore(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  >
                    {[5, 4, 3, 2, 1].map((val) => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Technical Skill (1-5)</label>
                  <select
                    value={techScore}
                    onChange={(e) => setTechScore(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  >
                    {[5, 4, 3, 2, 1].map((val) => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Problem Solving (1-5)</label>
                  <select
                    value={problemScore}
                    onChange={(e) => setProblemScore(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  >
                    {[5, 4, 3, 2, 1].map((val) => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Culture Fit (1-5)</label>
                  <select
                    value={cultureScore}
                    onChange={(e) => setCultureScore(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  >
                    {[5, 4, 3, 2, 1].map((val) => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Overall Recommendation</label>
                <select
                  value={recVal}
                  onChange={(e) => setRecVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 cursor-pointer"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="Strong Hire">Strong Hire</option>
                  <option value="Hire">Hire</option>
                  <option value="Hold">Hold</option>
                  <option value="Reject">Reject</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Interviewer Comments & Remarks</label>
                <textarea
                  value={scorecardComments}
                  onChange={(e) => setScorecardComments(e.target.value)}
                  placeholder="Detail communication style, coding feedback, technical strengths, and culture suggestions..."
                  rows="4"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowScorecardModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scorecardSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-blue-600/15"
                >
                  {scorecardSubmitting ? "Submitting..." : "Submit Scorecard"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDetails;
