import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import candidateService from "../services/candidateService";
import SearchFilterBar from "../components/SearchFilterBar";
import CandidateTable from "../components/CandidateTable";
import CandidateForm from "../components/CandidateForm";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";

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
        setTotalPages(data.totalPages || 1);
        setTotalCandidates(data.totalCandidates || 0);
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
        <div className="flex items-center gap-3">
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
            />
          )}
        </div>

        {/* Integrated Pagination inside Panel Footer */}
        {!loading && candidates.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-850">
            <span className="text-xs text-slate-450">
              Showing page <strong className="text-slate-200">{page}</strong> of <strong className="text-slate-200">{totalPages}</strong> ({totalCandidates} total candidates)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-350 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                Previous
              </button>
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
    </div>
  );
};

export default Candidates;
