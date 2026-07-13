import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import candidateService from "../services/candidateService";
import SearchFilterBar from "../components/SearchFilterBar";
import CandidateTable from "../components/CandidateTable";
import CandidateForm from "../components/CandidateForm";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";

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

const Candidates = () => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState(localStorage.getItem("pref_default_source") || "");
  const [archived, setArchived] = useState(localStorage.getItem("pref_default_view") || "false");
  const [sort, setSort] = useState(localStorage.getItem("pref_default_sort") || "newest");
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Email Outreach states
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [bulkEmailData, setBulkEmailData] = useState({ subject: "", body: "" });
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [newAttachmentFiles, setNewAttachmentFiles] = useState([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Manual Interview states for templates
  const [manualInterviewDate, setManualInterviewDate] = useState("");
  const [manualInterviewTime, setManualInterviewTime] = useState("");
  const [manualMeetingLink, setManualMeetingLink] = useState("");
  const [manualInterviewerName, setManualInterviewerName] = useState("");

  // Bulk Import CSV states
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkImporting, setBulkImporting] = useState(false);

  const handleBulkImportSubmit = async (e) => {
    e.preventDefault();
    if (!bulkFile) {
      toast.error("Please select a CSV file first");
      return;
    }

    setBulkImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target.result;
        
        // Parse CSV lines cleanly
        const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
        if (lines.length <= 1) {
          toast.error("CSV file is empty or only contains headers");
          setBulkImporting(false);
          return;
        }

        const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ''));
        const candidatesToImport = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length === 0 || !cols[0]) continue;

          // Map CSV headers to candidate attributes
          const candidateObj = {};
          headers.forEach((header, index) => {
            const val = cols[index] || "";
            if (header.toLowerCase() === "fullname" || header.toLowerCase() === "name") {
              candidateObj.fullName = val;
            } else if (header.toLowerCase() === "email") {
              candidateObj.email = val;
            } else if (header.toLowerCase() === "role" || header.toLowerCase() === "roleapplied") {
              candidateObj.roleApplied = val;
            } else if (header.toLowerCase() === "phone") {
              candidateObj.phone = val;
            } else if (header.toLowerCase() === "source") {
              candidateObj.source = val;
            } else if (header.toLowerCase() === "experience") {
              candidateObj.experience = val;
            } else if (header.toLowerCase() === "skills") {
              candidateObj.skills = val.split(";").map(s => s.trim()).filter(Boolean);
            }
          });

          // Validation
          if (!candidateObj.fullName || !candidateObj.email) continue;
          candidatesToImport.push(candidateObj);
        }

        if (candidatesToImport.length === 0) {
          toast.error("No valid candidate rows found. Email and Name are required.");
          setBulkImporting(false);
          return;
        }

        // Bulk insert candidates sequentially
        let successCount = 0;
        for (const candidate of candidatesToImport) {
          try {
            await candidateService.createCandidate(candidate);
            successCount++;
          } catch (err) {
            console.error("Bulk Insert error for:", candidate.email, err);
          }
        }

        toast.success(`Successfully imported ${successCount} candidates!`);
        setShowBulkImportModal(false);
        setBulkFile(null);
        fetchCandidates(search, status, source, archived, sort, 1);
      };
      
      reader.readAsText(bulkFile);
    } catch (err) {
      console.error("Bulk Import Error:", err);
      toast.error("Failed to parse and import CSV file");
    } finally {
      setBulkImporting(false);
    }
  };

  const fetchCandidates = async (searchQuery, statusQuery, sourceQuery, archivedQuery, sortQuery, pageNum) => {
    try {
      setLoading(true);
      const data = await candidateService.getCandidates(
        searchQuery,
        statusQuery,
        sourceQuery,
        archivedQuery,
        sortQuery,
        pageNum,
        10
      );
      
      if (data && data.candidates) {
        setCandidates(data.candidates);
        setTotalPages(data.totalPages || data.pages || 1);
        setTotalCandidates(data.totalCandidates || data.total || 0);
      } else {
        setCandidates(Array.isArray(data) ? data : []);
        setTotalPages(1);
        setTotalCandidates(Array.isArray(data) ? data.length : 0);
      }
    } catch (error) {
      console.error("Fetch Candidates Error:", error);
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1); // Reset page on filter changes
  }, [search, status, source, archived, sort]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCandidates(search, status, source, archived, sort, page);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, status, source, archived, sort, page]);

  const handleSelectRow = (candidateId) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCandidateIds.length === candidates.length) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(candidates.map((c) => c._id));
    }
  };

  const getPreviewCandidate = () => {
    if (selectedCandidateIds.length === 0) return null;
    return candidates.find(c => selectedCandidateIds.includes(c._id)) || null;
  };

  const replaceTemplateVariables = (text) => {
    if (!text) return "";
    const previewCand = getPreviewCandidate();
    if (!previewCand) return text;

    const companyName = localStorage.getItem("pref_profile_company") || "HireTrack";
    const isInterviewTemplate = selectedTemplateId === "predefined-invitation" || selectedTemplateId === "predefined-reminder";

    let intDateStr = "To be communicated";
    let intTimeStr = "To be communicated";
    let linkStr = "To be communicated";
    let interviewerNameStr = "To be communicated";

    if (isInterviewTemplate) {
      if (manualInterviewDate) {
        intDateStr = new Date(manualInterviewDate).toLocaleDateString();
      }
      if (manualInterviewTime) {
        intTimeStr = manualInterviewTime;
      }
      if (manualMeetingLink) {
        linkStr = manualMeetingLink;
      }
      if (manualInterviewerName) {
        interviewerNameStr = manualInterviewerName;
      }
    } else {
      intDateStr = previewCand.interviewDate ? new Date(previewCand.interviewDate).toLocaleDateString() : "To be communicated";
      intTimeStr = previewCand.interviewTime || "To be communicated";
      linkStr = "To be communicated";
      interviewerNameStr = previewCand.interviewerName || "To be communicated";
    }

    const jobTitle = previewCand.jobId?.title || previewCand.roleApplied || "Full Stack Developer";
    const recruiterName = user?.name || "Recruiter";

    return text
      .replace(/\{\{candidateName\}\}/gi, previewCand.fullName || "")
      .replace(/\{\{CandidateName\}\}/g, previewCand.fullName || "")
      .replace(/\{\{candidateEmail\}\}/gi, previewCand.email || "")
      .replace(/\{\{CandidateEmail\}\}/g, previewCand.email || "")
      .replace(/\{\{jobRole\}\}/gi, jobTitle)
      .replace(/\{\{RoleApplied\}\}/g, jobTitle)
      .replace(/\{\{company\}\}/gi, companyName)
      .replace(/\{\{interviewDate\}\}/gi, intDateStr)
      .replace(/\{\{interviewTime\}\}/gi, intTimeStr)
      .replace(/\{\{meetingLink\}\}/gi, linkStr)
      .replace(/\{\{interviewerName\}\}/gi, interviewerNameStr)
      .replace(/\{\{recruiterName\}\}/gi, recruiterName)
      .replace(/\{\{RecruiterName\}\}/g, recruiterName);
  };

  const replaceManualInterviewVars = (text) => {
    if (!text) return "";
    const isInterviewTemplate = selectedTemplateId === "predefined-invitation" || selectedTemplateId === "predefined-reminder";

    let intDateStr = "To be communicated";
    let intTimeStr = "To be communicated";
    let linkStr = "To be communicated";
    let interviewerNameStr = "To be communicated";

    if (isInterviewTemplate) {
      if (manualInterviewDate) {
        intDateStr = new Date(manualInterviewDate).toLocaleDateString();
      }
      if (manualInterviewTime) {
        intTimeStr = manualInterviewTime;
      }
      if (manualMeetingLink) {
        linkStr = manualMeetingLink;
      }
      if (manualInterviewerName) {
        interviewerNameStr = manualInterviewerName;
      }
      
      return text
        .replace(/\{\{interviewDate\}\}/gi, intDateStr)
        .replace(/\{\{interviewTime\}\}/gi, intTimeStr)
        .replace(/\{\{meetingLink\}\}/gi, linkStr)
        .replace(/\{\{interviewerName\}\}/gi, interviewerNameStr);
    }
    
    return text;
  };

  const handleTemplateChange = (e) => {
    const tempId = e.target.value;
    setSelectedTemplateId(tempId);
    if (!tempId) {
      setBulkEmailData({ subject: "", body: "" });
      return;
    }
    const temp = PREDEFINED_TEMPLATES.find((t) => t._id === tempId);
    if (temp) {
      setBulkEmailData({ subject: temp.subject, body: temp.body });
    }
  };

  const handleBulkEmailSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!bulkEmailData.subject || !bulkEmailData.body) {
      toast.error("Subject and message body are required");
      return;
    }

    if (selectedCandidateIds.length === 0) {
      toast.error("At least one candidate must be selected");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const selectedCandidates = candidates.filter(c => selectedCandidateIds.includes(c._id));
    const missingOrInvalidEmails = selectedCandidates.filter(c => !c.email || !emailRegex.test(c.email));

    if (missingOrInvalidEmails.length > 0) {
      const names = missingOrInvalidEmails.map(c => c.fullName || "Unknown").join(", ");
      toast.error(`Invalid/missing emails for: ${names}`);
      return;
    }

    try {
      setLoading(true);

      const finalSubject = replaceManualInterviewVars(bulkEmailData.subject);
      const finalBody = replaceManualInterviewVars(bulkEmailData.body);

      const formData = new FormData();
      formData.append("candidateIds", JSON.stringify(selectedCandidateIds));
      formData.append("subject", finalSubject);
      formData.append("message", finalBody);

      if (selectedAttachments.length > 0) {
        formData.append("existingAttachments", JSON.stringify(selectedAttachments));
      }

      if (newAttachmentFiles.length > 0) {
        for (const file of newAttachmentFiles) {
          formData.append("attachments", file);
        }
      }

      const res = await candidateService.bulkEmail(selectedCandidateIds, finalSubject, finalBody, formData);

      if (res.failedCount > 0) {
        toast.error(`${res.sentCount} emails sent successfully, ${res.failedCount} failed.`);
      } else {
        toast.success("✓ Email campaign sent successfully.");
        setShowBulkEmailModal(false);
        setIsPreviewMode(false);
        setBulkEmailData({ subject: "", body: "" });
        setSelectedTemplateId("");
        setSelectedAttachments([]);
        setNewAttachmentFiles([]);
        setSelectedCandidateIds([]);
        setManualInterviewDate("");
        setManualInterviewTime("");
        setManualMeetingLink("");
        setManualInterviewerName("");
        fetchCandidates(search, status, source, archived, sort, page);
      }
    } catch (error) {
      console.error("Bulk Email failed:", error);
      const msg = error.response?.data?.message || "Failed to send bulk outreach emails";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCandidate(null);
    setShowModal(true);
  };

  const handleOpenEdit = (candidate) => {
    setEditingCandidate(candidate);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCandidate(null);
  };

  const handleSubmitForm = async (formData, resumeFile) => {
    // Validations
    if (!formData.fullName || !formData.fullName.trim()) {
      toast.error("Candidate full name is required");
      return;
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!formData.phone || !formData.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!formData.roleApplied || !formData.roleApplied.trim()) {
      toast.error("Role applied is required");
      return;
    }

    // Duplicate check
    const isDuplicate = candidates.some(
      (c) =>
        c.email.toLowerCase() === formData.email.toLowerCase() &&
        (!editingCandidate || c._id !== editingCandidate._id)
    );
    if (isDuplicate) {
      const confirmSave = window.confirm(
        "A candidate with this email address already exists. Do you still want to proceed?"
      );
      if (!confirmSave) return;
    }

    setIsSubmitting(true);
    try {
      let savedCandidate;
      if (editingCandidate) {
        savedCandidate = await candidateService.updateCandidate(editingCandidate._id, formData);
        toast.success("Candidate updated successfully!");
      } else {
        savedCandidate = await candidateService.createCandidate(formData);
        toast.success("Candidate added successfully!");
      }

      // If a resume file was selected, upload it now
      if (resumeFile && savedCandidate && savedCandidate._id) {
        await candidateService.uploadResumeFile(savedCandidate._id, resumeFile);
        toast.success("Resume document uploaded successfully!");
      }

      handleCloseModal();
      fetchCandidates(search, status, source, archived, sort, page);
    } catch (error) {
      console.error("Save Candidate Error:", error);
      const msg = error.response?.data?.message || "Failed to save candidate. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (id) => {
    try {
      await candidateService.archiveCandidate(id);
      toast.success("Candidate archived successfully!");
      fetchCandidates(search, status, source, archived, sort, page);
    } catch (error) {
      console.error("Archive Candidate Error:", error);
      toast.error("Failed to archive candidate");
    }
  };

  const handleRestore = async (id) => {
    try {
      await candidateService.restoreCandidate(id);
      toast.success("Candidate restored to active pipeline!");
      fetchCandidates(search, status, source, archived, sort, page);
    } catch (error) {
      console.error("Restore Candidate Error:", error);
      toast.error("Failed to restore candidate");
    }
  };

  const handleDeleteCandidate = async (id) => {
    if (window.confirm("Are you sure you want to PERMANENTLY delete this candidate? This action cannot be undone.")) {
      try {
        await candidateService.deleteCandidate(id);
        toast.success("Candidate deleted permanently!");
        fetchCandidates(search, status, source, archived, sort, page);
      } catch (error) {
        console.error("Delete Candidate Error:", error);
        toast.error("Failed to delete candidate");
      }
    }
  };

  const exportToCSV = () => {
    if (candidates.length === 0) {
      toast.error("No candidates to export");
      return;
    }

    const headers = [
      "Full Name", "Email", "Phone", "Role Applied", "Status", "Experience",
      "Current Company", "Current Location", "Source", "Notice Period",
      "Expected Salary", "Interview Date", "Interviewer Name", "Applied Date"
    ];

    const rows = candidates.map(c => [
      `"${(c.fullName || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.roleApplied || '').replace(/"/g, '""')}"`,
      `"${(c.status || '').replace(/"/g, '""')}"`,
      `"${(c.experience || '').replace(/"/g, '""')}"`,
      `"${(c.currentCompany || '').replace(/"/g, '""')}"`,
      `"${(c.currentLocation || '').replace(/"/g, '""')}"`,
      `"${(c.source || '').replace(/"/g, '""')}"`,
      `"${(c.noticePeriod || '').replace(/"/g, '""')}"`,
      `"${(c.expectedSalary || '').replace(/"/g, '""')}"`,
      c.interviewDate ? `"${new Date(c.interviewDate).toLocaleDateString()}"` : '""',
      `"${(c.interviewerName || '').replace(/"/g, '""')}"`,
      `"${new Date(c.createdAt).toLocaleDateString()}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `candidates_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export download started!");
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Candidates</h1>
          <p className="text-slate-400 text-sm mt-1">Manage and track candidates through your recruitment stages</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4.5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-350 hover:text-white border border-slate-800 font-semibold text-sm transition-all cursor-pointer shadow-sm shadow-blue-500/5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
          {user?.role !== "Interviewer" && (
            <>
              {selectedCandidateIds.length > 0 && (
                <button
                  onClick={() => setShowBulkEmailModal(true)}
                  className="inline-flex items-center gap-2 px-4.5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md shadow-blue-500/15 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Outreach ({selectedCandidateIds.length})
                </button>
              )}
              <button
                onClick={() => setShowBulkImportModal(true)}
                className="inline-flex items-center gap-2 px-4.5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-350 hover:text-white border border-slate-800 font-semibold text-sm transition-all cursor-pointer shadow-sm shadow-blue-500/5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Bulk Import
              </button>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md shadow-blue-500/15 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Candidate
              </button>
            </>
          )}
        </div>
      </div>

      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        statusValue={status}
        onStatusChange={setStatus}
        sourceValue={source}
        onSourceChange={setSource}
        archivedValue={archived}
        onArchivedChange={setArchived}
        sortValue={sort}
        onSortChange={setSort}
      />

      {/* Large ATS results panel wrapping Loader, EmptyState, CandidateTable, and Pagination */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm relative min-h-[300px] flex flex-col justify-between">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
            <Loader fullPage={false} />
          </div>
        )}

        <div className="flex-1">
          {!loading && candidates.length === 0 ? (
            <EmptyState
              title={search || status || source || archived === "true" ? "No matching candidates" : "Hiring pipeline is empty"}
              message={
                search || status || source || archived === "true"
                  ? "We couldn't find any results matching your current filters. Try resetting search parameters."
                  : "Start tracking candidates by clicking the 'Add Candidate' button to begin your hiring process."
              }
              actionText={search || status || source || archived === "true" ? "Reset Filters" : "Add Candidate"}
              onActionClick={
                search || status || source || archived === "true"
                  ? () => {
                      setSearch("");
                      setStatus("");
                      setSource("");
                      setArchived("false");
                      setSort("newest");
                    }
                  : handleOpenAdd
              }
            />
          ) : (
            <CandidateTable
              candidates={candidates}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteCandidate}
              onArchive={handleArchive}
              onRestore={handleRestore}
              selectedIds={selectedCandidateIds}
              onSelectRow={handleSelectRow}
              onSelectAll={handleSelectAll}
            />
          )}
        </div>

        {/* Integrated Pagination inside Panel Footer */}
        {!loading && candidates.length > 0 && totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between mt-6 pt-4 border-t border-slate-850 gap-4">
            <span className="text-xs text-slate-450">
              Showing page <strong className="text-slate-200">{page}</strong> of <strong className="text-slate-200">{totalPages}</strong> ({totalCandidates} total candidates)
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-350 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                Previous
              </button>

              {/* Page Number Buttons */}
              {Array.from({ length: totalPages }, (_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      page === pageNum
                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/10"
                        : "bg-slate-900 border-slate-800 text-slate-350 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                disabled={page === totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-350 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingCandidate ? "Edit Candidate Details" : "Add New Candidate"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <CandidateForm
                initialData={editingCandidate}
                onSubmit={handleSubmitForm}
                onCancel={handleCloseModal}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}
      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col premium-card">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Bulk Import Candidates</h2>
              <button
                onClick={() => {
                  setShowBulkImportModal(false);
                  setBulkFile(null);
                }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleBulkImportSubmit} className="p-6 space-y-5">
              <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/40 rounded-xl p-8 text-center bg-slate-950/40 relative cursor-pointer group transition-all">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setBulkFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500 group-hover:text-blue-400 mx-auto transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-xs text-slate-350 font-semibold group-hover:text-blue-400 transition-colors">
                    {bulkFile ? bulkFile.name : "Drag & drop candidate CSV, or click to browse"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">Requires column headers: Name/FullName, Email, Role/RoleApplied, Phone, Source, Experience, Skills</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-850/80">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkImportModal(false);
                    setBulkFile(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkImporting}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-blue-600/15"
                >
                  {bulkImporting ? "Importing..." : "Upload & Parse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bulk Email Modal */}
      {showBulkEmailModal && (
        <div className="fixed inset-0 bg-slate-955/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn print:hidden">
          <div className="bg-slate-905 border border-slate-850 rounded-2xl w-full max-w-lg shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
              <h2 className="text-lg font-bold text-white">
                {isPreviewMode ? "Preview Bulk Email Campaign" : "Send Bulk Outreach Email"}
              </h2>
              <button
                onClick={() => {
                  setShowBulkEmailModal(false);
                  setIsPreviewMode(false);
                  setSelectedAttachments([]);
                  setNewAttachmentFiles([]);
                  setSelectedTemplateId("");
                  setManualInterviewDate("");
                  setManualInterviewTime("");
                  setManualMeetingLink("");
                  setManualInterviewerName("");
                }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {!isPreviewMode ? (
              <form onSubmit={(e) => { e.preventDefault(); setIsPreviewMode(true); }} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
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
                  </select>
                </div>

                {(selectedTemplateId === "predefined-invitation" || selectedTemplateId === "predefined-reminder") && (
                  <div className="p-4 bg-slate-950/40 border border-slate-850/80 rounded-xl space-y-3 animate-fadeIn">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Manual Interview Details</span>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">Interview Date</label>
                        <input
                          type="date"
                          value={manualInterviewDate}
                          onChange={(e) => setManualInterviewDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
                          style={{ colorScheme: "dark" }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">Interview Time</label>
                        <input
                          type="text"
                          placeholder="e.g. 10:00 AM IST"
                          value={manualInterviewTime}
                          onChange={(e) => setManualInterviewTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">Meeting Link (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. https://meet.google.com/..."
                          value={manualMeetingLink}
                          onChange={(e) => setManualMeetingLink(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">Interviewer (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Jane Doe"
                          value={manualInterviewerName}
                          onChange={(e) => setManualInterviewerName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Update regarding your application"
                    value={bulkEmailData.subject}
                    onChange={(e) => setBulkEmailData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-200 text-xs focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Message Body</label>
                  <textarea
                    rows="6"
                    required
                    placeholder="Dear {{CandidateName}}, thank you for applying for {{RoleApplied}}..."
                    value={bulkEmailData.body}
                    onChange={(e) => setBulkEmailData(prev => ({ ...prev, body: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-200 text-xs focus:outline-none focus:border-blue-500/50 resize-none font-mono"
                  />
                </div>

                <div className="text-[9px] text-slate-500 leading-normal bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                  <span className="font-bold">Dynamic Variables:</span> Use <code className="text-blue-400">{"{{candidateName}}"}</code> for candidate name, <code className="text-blue-400">{"{{jobRole}}"}</code> for role, and <code className="text-blue-400">{"{{recruiterName}}"}</code> for recruiter.
                </div>

                {/* Attachment options section */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Resolve Candidate Documents Dynamically
                  </label>
                  <div className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-slate-850 text-xs">
                    <label className="flex items-center gap-2 text-slate-350 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAttachments.some(a => a.type === "resume")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAttachments(prev => [...prev, { filename: "Resume.pdf", type: "resume" }]);
                          } else {
                            setSelectedAttachments(prev => prev.filter(a => a.type !== "resume"));
                          }
                        }}
                        className="h-3.5 w-3.5 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <span>Resume (Candidate's Uploaded PDF)</span>
                    </label>

                    <label className="flex items-center gap-2 text-slate-355 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAttachments.some(a => a.type === "coverLetter")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAttachments(prev => [...prev, { filename: "CoverLetter.pdf", type: "coverLetter" }]);
                          } else {
                            setSelectedAttachments(prev => prev.filter(a => a.type !== "coverLetter"));
                          }
                        }}
                        className="h-3.5 w-3.5 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <span>Cover Letter (Candidate's Stored PDF)</span>
                    </label>

                    <label className="flex items-center gap-2 text-slate-355 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAttachments.some(a => a.type === "certificates")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAttachments(prev => [...prev, { filename: "Certificates", type: "certificates" }]);
                          } else {
                            setSelectedAttachments(prev => prev.filter(a => a.type !== "certificates"));
                          }
                        }}
                        className="h-3.5 w-3.5 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <span>Certificates Portfolio</span>
                    </label>

                    <div className="pt-2 border-t border-slate-900/60 space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Broadcast Attachment to All</span>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => setNewAttachmentFiles(Array.from(e.target.files))}
                        className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-blue-600/20 file:text-blue-400 file:cursor-pointer hover:file:bg-blue-600/30"
                      />
                      {newAttachmentFiles.length > 0 && (
                        <div className="text-[9px] text-slate-500 mt-1">
                          Selected: {newAttachmentFiles.map(f => f.name).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkEmailModal(false);
                      setIsPreviewMode(false);
                      setSelectedAttachments([]);
                      setNewAttachmentFiles([]);
                      setSelectedTemplateId("");
                      setManualInterviewDate("");
                      setManualInterviewTime("");
                      setManualMeetingLink("");
                      setManualInterviewerName("");
                    }}
                    className="px-4 py-2 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
                  >
                    Preview Campaign
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3 text-xs text-slate-350">
                  <div>
                    <span className="font-bold text-slate-500 block uppercase text-[9px] tracking-wider">Recipient(s):</span>
                    <div className="text-white font-medium max-h-[60px] overflow-y-auto pr-1">
                      {candidates.filter(c => selectedCandidateIds.includes(c._id)).map(c => c.email).join(", ")}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block uppercase text-[9px] tracking-wider">Subject Preview (Sample):</span>
                    <span className="text-white font-semibold">{replaceTemplateVariables(bulkEmailData.subject)}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block uppercase text-[9px] tracking-wider mb-1">Message Preview (Sample):</span>
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900 text-slate-300 whitespace-pre-line leading-relaxed">
                      {replaceTemplateVariables(bulkEmailData.body)}
                    </div>
                  </div>
                  {(selectedAttachments.length > 0 || newAttachmentFiles.length > 0) && (
                    <div>
                      <span className="font-bold text-slate-500 block uppercase text-[9px] tracking-wider mb-1">Attachments:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedAttachments.map((att, aIdx) => (
                          <span key={aIdx} className="px-2 py-0.5 rounded bg-slate-900 text-slate-455 border border-slate-850 text-[10px]">
                            {att.filename} (Dynamic)
                          </span>
                        ))}
                        {newAttachmentFiles.map((file, aIdx) => (
                          <span key={aIdx} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">
                            {file.name} (Broadcast)
                          </span>
                        ))}
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
                    onClick={handleBulkEmailSubmit}
                    disabled={loading}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    {loading ? (
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
    </div>
  );
};

export default Candidates;
