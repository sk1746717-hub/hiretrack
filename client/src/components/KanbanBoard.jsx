import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import candidateService from "../services/candidateService";

const COLUMNS = [
  { id: "Applied", title: "Applied", color: "border-t-sky-500", glow: "shadow-sky-500/10", text: "text-sky-400", bg: "bg-sky-500/10" },
  { id: "Screening", title: "Screening", color: "border-t-amber-500", glow: "shadow-amber-500/10", text: "text-amber-400", bg: "bg-amber-500/10" },
  { id: "Shortlisted", title: "Shortlisted", color: "border-t-teal-500", glow: "shadow-teal-500/10", text: "text-teal-400", bg: "bg-teal-500/10" },
  { id: "Interview", title: "Interview", color: "border-t-purple-500", glow: "shadow-purple-500/10", text: "text-purple-400", bg: "bg-purple-500/10" },
  { id: "Selected", title: "Selected", color: "border-t-emerald-500", glow: "shadow-emerald-500/10", text: "text-emerald-400", bg: "bg-emerald-500/10" },
  { id: "Rejected", title: "Rejected", color: "border-t-rose-500", glow: "shadow-rose-500/10", text: "text-rose-400", bg: "bg-rose-500/10" }
];

const KanbanBoard = ({ candidates, onUpdate }) => {
  const [draggedId, setDraggedId] = useState(null);

  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedId;
    if (!id) return;

    // Find candidate to prevent redundant updates
    const candidate = candidates.find(c => c._id === id);
    if (!candidate || candidate.status === targetStatus) {
      setDraggedId(null);
      return;
    }

    try {
      // Optimistic UI update trigger
      const updatedCandidates = candidates.map(c => 
        c._id === id ? { ...c, status: targetStatus } : c
      );
      onUpdate(updatedCandidates);

      // API Call
      await candidateService.updateCandidate(id, { status: targetStatus });
      toast.success(`${candidate.fullName} status updated to ${targetStatus}`);
    } catch (error) {
      console.error("Failed to update status on Kanban drop:", error);
      toast.error("Failed to update candidate status");
      // Rollback to original if API fails
      onUpdate(candidates);
    } finally {
      setDraggedId(null);
    }
  };

  const getCandidatesByStatus = (status) => {
    return candidates.filter((c) => c.status === status);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 60) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 w-full max-w-full select-none snap-x scroll-smooth">
      {COLUMNS.map((col) => {
        const list = getCandidatesByStatus(col.id);

        return (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className="flex-1 min-w-[280px] max-w-[340px] bg-slate-950/25 border border-slate-900/60 rounded-2xl flex flex-col h-[calc(100vh-220px)] backdrop-blur-md snap-start"
          >
            {/* Column Header */}
            <div className={`p-4 border-t-2 ${col.color} border-b border-slate-900/40 flex items-center justify-between shrink-0`}>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${col.bg.replace('/10', '')} animate-pulse`}></span>
                <h3 className="font-bold text-sm text-white">{col.title}</h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-800 bg-slate-900/60 text-slate-400`}>
                {list.length}
              </span>
            </div>

            {/* Column Content Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {list.length === 0 ? (
                <div className="h-full flex items-center justify-center border border-dashed border-slate-900 rounded-xl py-12">
                  <p className="text-[11px] text-slate-600">Drag candidates here</p>
                </div>
              ) : (
                list.map((candidate) => (
                  <div
                    key={candidate._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, candidate._id)}
                    className="p-4 rounded-xl border border-slate-850 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-800 transition-all cursor-grab active:cursor-grabbing hover:shadow-[0_0_15px_rgba(59,130,246,0.08)] group"
                  >
                    <div className="space-y-2">
                      {/* Name & Match Score */}
                      <div className="flex justify-between items-start gap-2">
                        <Link
                          to={`/candidates/${candidate._id}`}
                          className="font-bold text-sm text-white hover:text-blue-400 group-hover:text-blue-400 transition-colors leading-tight"
                        >
                          {candidate.fullName}
                        </Link>
                        {candidate.matchScore > 0 && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getScoreColor(candidate.matchScore)} shrink-0`}>
                            {candidate.matchScore}%
                          </span>
                        )}
                      </div>

                      {/* Job Title / Applied Role */}
                      <p className="text-xs text-slate-400 font-medium">
                        {candidate.jobId?.title || candidate.roleApplied}
                      </p>

                      {/* Primary Skills Tags */}
                      {candidate.skills && candidate.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {candidate.skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="text-[9px] px-2 py-0.5 rounded bg-slate-950/60 border border-slate-900 text-slate-500"
                            >
                              {skill}
                            </span>
                          ))}
                          {candidate.skills.length > 3 && (
                            <span className="text-[9px] px-1.5 py-0.5 text-slate-600">
                              +{candidate.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Card Footer details */}
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-900/50">
                        <span>Exp: {candidate.experience || "N/A"}</span>
                        <span>{candidate.source || "Organic"}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
