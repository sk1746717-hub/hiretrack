import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import candidateService from "../services/candidateService";
import toast from "react-hot-toast";

const Pipeline = () => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const columns = [
    { id: "Applied", title: "Applied", color: "border-blue-500/25" },
    { id: "Screening", title: "Screening", color: "border-amber-500/25" },
    { id: "Interview", title: "Interview", color: "border-purple-500/25" },
    { id: "Selected", title: "Selected / Offer", color: "border-emerald-500/25" },
    { id: "Rejected", title: "Rejected", color: "border-rose-500/25" },
  ];

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      // Fetch only active (non-archived) candidates
      const response = await candidateService.getCandidates("", "", "", "false", "newest");
      setCandidates(
        Array.isArray(response)
          ? response
          : response.candidates || []
      );
    } catch (error) {
      console.error("Fetch Pipeline Error:", error);
      toast.error("Failed to load candidates pipeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e, candidateId) => {
    if (user?.role === "Interviewer") {
      e.preventDefault();
      toast.error("Interviewers cannot update candidate stages");
      return;
    }
    e.dataTransfer.setData("text/plain", candidateId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    if (user?.role === "Interviewer") {
      toast.error("Interviewers cannot update candidate stages");
      return;
    }
    const candidateId = e.dataTransfer.getData("text/plain");
    if (!candidateId) return;

    const safeCandidates = Array.isArray(candidates) ? candidates : [];
    // Find candidate to see if status actually changed
    const candidate = safeCandidates.find((c) => c._id === candidateId);
    if (!candidate || candidate.status === targetStatus) return;

    // Optimistically update UI state
    const originalCandidates = [...safeCandidates];
    setCandidates((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.map((c) => (c._id === candidateId ? { ...c, status: targetStatus } : c));
    });

    try {
      const updatedData = {
        ...candidate,
        status: targetStatus,
      };
      await candidateService.updateCandidate(candidateId, updatedData);
      toast.success(`Moved ${candidate.fullName} to ${targetStatus}`);
    } catch (error) {
      console.error("Drop Update Error:", error);
      toast.error("Failed to update candidate status");
      // Revert state if error
      setCandidates(originalCandidates);
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Group candidates by status
  const getCandidatesByStatus = (status) => {
    const safeCandidates = Array.isArray(candidates) ? candidates : [];
    return safeCandidates.filter((c) => c.status === status);
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Hiring Pipeline</h1>
        <p className="text-slate-400 text-sm mt-1">Drag and drop candidates across stages to update recruitment statuses</p>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm relative min-h-[500px] flex flex-col justify-between">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading Pipeline...</span>
            </div>
          </div>
        )}

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {columns.map((col) => {
            const columnCandidates = getCandidatesByStatus(col.id);
            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className="flex-1 min-w-[260px] max-w-[320px] bg-slate-950/20 border border-slate-900 rounded-2xl p-4 flex flex-col h-[70vh] backdrop-blur-md shadow-sm shrink-0"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-900 mb-4">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{col.title}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-850 text-slate-400 font-bold">
                    {columnCandidates.length}
                  </span>
                </div>

                {/* Candidate Cards list */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                  {columnCandidates.length === 0 ? (
                    <div className="h-28 border border-dashed border-slate-850 rounded-xl flex items-center justify-center text-center p-4">
                      <span className="text-slate-500 text-xs font-medium">No candidates here</span>
                    </div>
                  ) : (
                    columnCandidates.map((candidate) => (
                       <div
                        key={candidate._id}
                        draggable={user?.role !== "Interviewer"}
                        onDragStart={(e) => handleDragStart(e, candidate._id)}
                        onClick={() => navigate(`/candidates/${candidate._id}`)}
                        className={`bg-slate-950/40 hover:bg-slate-900/30 border border-slate-900 hover:border-blue-500/40 p-4 rounded-xl space-y-3 transition-all duration-150 shadow-sm ${
                          user?.role === "Interviewer" ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/candidates/${candidate._id}`);
                            }}
                            className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/30 border border-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-xs shrink-0 cursor-pointer hover:border-blue-400"
                          >
                            {getInitials(candidate.fullName)}
                          </div>
                          <div className="overflow-hidden flex-1">
                            <h4
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/candidates/${candidate._id}`);
                              }}
                              className="text-sm font-semibold text-white truncate cursor-pointer hover:text-blue-400 hover:underline"
                            >
                              {candidate.fullName}
                            </h4>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{candidate.roleApplied}</p>
                          </div>
                        </div>

                        {/* Metadata fields */}
                        <div className="space-y-1.5 pt-2.5 border-t border-slate-900/60 text-[10px] text-slate-500">
                          {candidate.experience && (
                            <div className="flex justify-between">
                              <span>Experience:</span>
                              <span className="text-slate-400 font-medium">{candidate.experience}</span>
                            </div>
                          )}
                          {candidate.source && (
                            <div className="flex justify-between">
                              <span>Source:</span>
                              <span className="text-slate-400 font-medium">{candidate.source}</span>
                            </div>
                          )}
                          {candidate.interviewDate && (
                            <div className="flex justify-between items-center text-blue-400/90 font-semibold pt-0.5">
                              <span>Interview:</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                                {new Date(candidate.interviewDate).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Pipeline;
